from datetime import datetime
from flask import Blueprint, request, jsonify, Response, g
from sqlalchemy.orm import selectinload, joinedload
from app.extensions import db
from app.models import Pedido, DetallePedido, Usuario, Producto, Categoria
from app.utils.decorators import requiere_roles
from app.roles import (
    PUEDE_VER_PEDIDOS,
    PUEDE_GESTIONAR_PEDIDOS,
    PUEDE_VER_DASHBOARD,
    PUEDE_GESTIONAR_REEMBOLSOS,
    PUEDE_REGISTRAR_VENTA,
)
from app.utils.stock import restaurar_stock_de_pedido, agrupar_por_producto, validar_stock_disponible, descontar_stock
from app.utils.boleta import generar_pdf_boleta
from app.utils.culqi import reembolsar_en_culqi

bp = Blueprint("admin_pedidos", __name__, url_prefix="/api/admin/pedidos")


@bp.get("")
@requiere_roles(*PUEDE_VER_PEDIDOS)
def listar():
    query = Pedido.query.options(joinedload(Pedido.cliente))

    estado = request.args.get("estado")
    if estado:
        query = query.filter_by(estado=estado)

    pagina = max(request.args.get("pagina", 1, type=int) or 1, 1)
    por_pagina = min(max(request.args.get("por_pagina", 20, type=int) or 20, 1), 100)
    paginado = query.order_by(Pedido.fecha_creacion.desc()).paginate(
        page=pagina, per_page=por_pagina, error_out=False
    )

    resultado = []
    for p in paginado.items:
        data = p.to_dict(con_detalles=False)
        data["cliente"] = p.cliente.nombre_completo if p.cliente else None
        data["cliente_email"] = p.cliente.email if p.cliente else None
        resultado.append(data)

    return jsonify({
        "pedidos": resultado,
        "total": paginado.total,
        "paginas": paginado.pages,
        "pagina_actual": paginado.page,
    })


@bp.get("/<int:pedido_id>")
@requiere_roles(*PUEDE_VER_PEDIDOS)
def detalle(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)
    data = pedido.to_dict()
    data["cliente"] = pedido.cliente.nombre_completo if pedido.cliente else None
    data["cliente_email"] = pedido.cliente.email if pedido.cliente else None
    data["cliente_telefono"] = pedido.cliente.telefono if pedido.cliente else None
    return jsonify(data)


@bp.put("/<int:pedido_id>/estado")
@requiere_roles(*PUEDE_GESTIONAR_PEDIDOS)
def cambiar_estado(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)
    data = request.get_json(force=True) or {}
    nuevo_estado = data.get("estado")

    if nuevo_estado not in Pedido.ESTADOS:
        return jsonify({"error": "Estado no válido"}), 400

    # PUEDE_GESTIONAR_PEDIDOS incluye a Almacén (para preparar/despachar),
    # pero cancelar un pedido implica devolver stock y, si el pago ya estaba
    # verificado, disparar un reembolso — eso es exclusivo de quien puede
    # gestionar reembolsos (Ventas / Super admin). Por eso este chequeo extra
    # aquí, además del que ya hace el decorador.
    if nuevo_estado == "cancelado" and g.usuario.rol not in PUEDE_GESTIONAR_REEMBOLSOS:
        return jsonify({"error": "No tienes permisos para cancelar pedidos"}), 403

    if not pedido.puede_pasar_a(nuevo_estado):
        return jsonify({
            "error": f"No se puede pasar de \"{pedido.estado_label}\" a \"{Pedido.ESTADOS[nuevo_estado]}\""
        }), 400

    # Si se está cancelando y ya se le había confirmado el pago, marcamos que
    # hay que devolverle el dinero.
    if nuevo_estado == "cancelado":
        restaurar_stock_de_pedido(pedido)
        if pedido.estado_pago == "verificado":
            pedido.estado_pago = "reembolso_pendiente"

    pedido.estado = nuevo_estado
    db.session.commit()
    return jsonify(pedido.to_dict())


@bp.put("/<int:pedido_id>/envio")
@requiere_roles(*PUEDE_GESTIONAR_PEDIDOS)
def actualizar_envio(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)
    if pedido.estado == "cancelado":
        return jsonify({"error": "Este pedido ya está cancelado y no se puede modificar"}), 400

    data = request.get_json(force=True) or {}
    pedido.empresa_envio = (data.get("empresa_envio") or "").strip()[:100] or None
    pedido.numero_seguimiento = (data.get("numero_seguimiento") or "").strip()[:100] or None

    db.session.commit()
    return jsonify(pedido.to_dict())


@bp.put("/<int:pedido_id>/pago")
@requiere_roles(*PUEDE_GESTIONAR_REEMBOLSOS)
def revisar_pago(pedido_id):
    """Aprueba/rechaza el comprobante subido, o marca un reembolso como completado."""
    pedido = Pedido.query.get_or_404(pedido_id)
    data = request.get_json(force=True) or {}
    nuevo_estado_pago = data.get("estado_pago")

    if nuevo_estado_pago not in ("verificado", "rechazado", "reembolsado"):
        return jsonify({
            "error": "Solo puedes marcar el pago como verificado, rechazado o reembolsado"
        }), 400

    # Marcar "reembolsado" es la ÚNICA acción permitida en un pedido ya cancelado
    # (es justamente lo que hay que hacer después de cancelarlo si tenía pago verificado).
    if nuevo_estado_pago == "reembolsado":
        if pedido.estado_pago != "reembolso_pendiente":
            return jsonify({"error": "Este pedido no tiene un reembolso pendiente"}), 400
        # Si se cobró por pasarela (Culqi), el dinero se devuelve de verdad
        # ahí ANTES de marcar el pedido como reembolsado — así este estado
        # no es solo una etiqueta en el panel, refleja un reembolso real.
        if pedido.metodo_pago in ("tarjeta", "yape") and pedido.culqi_cargo_id:
            ok, _, error = reembolsar_en_culqi(pedido)
            if not ok:
                return jsonify({"error": f"No se pudo reembolsar en Culqi: {error}"}), 502
        pedido.estado_pago = "reembolsado"
        db.session.commit()
        return jsonify(pedido.to_dict())

    if pedido.estado == "cancelado":
        return jsonify({
            "error": "Este pedido ya está cancelado y no se puede modificar"
        }), 400

    pedido.estado_pago = nuevo_estado_pago

    # Si se verifica el pago y el pedido seguía "pendiente", lo pasamos a "confirmado"
    if nuevo_estado_pago == "verificado" and pedido.estado == "pendiente":
        pedido.estado = "confirmado"

    # REGLA: un pago rechazado implica que el pedido se cancela y el stock que
    # se había descontado en el checkout se devuelve. Sin esto, el stock queda
    # "atrapado" (descontado) indefinidamente hasta que alguien cancele el
    # pedido a mano por separado.
    #
    # restaurar_stock_de_pedido() solo se llama aquí, protegido por
    # puede_pasar_a("cancelado") + el guard de "ya cancelado" de arriba, así
    # que no puede ejecutarse dos veces para el mismo pedido.
    if nuevo_estado_pago == "rechazado":
        if not pedido.puede_pasar_a("cancelado"):
            return jsonify({
                "error": (
                    f"El pago se marcó como rechazado, pero el pedido ya está "
                    f"en estado \"{pedido.estado_label}\" y no admite cancelación "
                    f"automática. Gestiona la cancelación/reembolso manualmente."
                )
            }), 400
        restaurar_stock_de_pedido(pedido)
        pedido.estado = "cancelado"

    db.session.commit()
    return jsonify(pedido.to_dict())


@bp.get("/resumen/estadisticas")
@requiere_roles(*PUEDE_VER_DASHBOARD)
def estadisticas():
    total_pedidos = Pedido.query.count()
    pendientes = Pedido.query.filter_by(estado="pendiente").count()
    pagos_por_revisar = Pedido.query.filter_by(estado_pago="en_revision").count()
    reembolsos_pendientes = Pedido.query.filter_by(estado_pago="reembolso_pendiente").count()

    ventas_confirmadas = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        db.or_(
            Pedido.estado_pago == "verificado",
            db.and_(Pedido.estado_pago == "no_aplica", Pedido.estado == "entregado"),
        )
    ).scalar()

    monto_pagos_pendientes = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        Pedido.estado_pago == "pendiente"
    ).scalar()
    monto_en_revision = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        Pedido.estado_pago == "en_revision"
    ).scalar()
    monto_rechazado = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        Pedido.estado_pago == "rechazado"
    ).scalar()
    monto_reembolsos = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        Pedido.estado_pago.in_(("reembolso_pendiente", "reembolsado"))
    ).scalar()
    monto_cancelado = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
        Pedido.estado == "cancelado"
    ).scalar()

    total_clientes = Usuario.query.filter_by(es_admin=False).count()
    total_productos = Producto.query.filter_by(activo=True).count()
    productos_bajo_stock = sum(
        1 for p in Producto.query.filter_by(activo=True).options(selectinload(Producto.variantes)).all()
        if p.stock_total <= 3
    )

    hoy = datetime.utcnow()
    meses_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    ventas_por_mes = []
    for i in range(5, -1, -1):
        mes_idx = (hoy.month - 1 - i) % 12
        anio = hoy.year + ((hoy.month - 1 - i) // 12)
        inicio_mes = datetime(anio, mes_idx + 1, 1)
        fin_mes = datetime(anio + (1 if mes_idx == 11 else 0), (mes_idx % 12) + 2, 1) if mes_idx != 11 else datetime(anio + 1, 1, 1)
        total_mes = db.session.query(db.func.coalesce(db.func.sum(Pedido.total), 0)).filter(
            Pedido.fecha_creacion >= inicio_mes,
            Pedido.fecha_creacion < fin_mes,
            db.or_(
                Pedido.estado_pago == "verificado",
                db.and_(Pedido.estado_pago == "no_aplica", Pedido.estado == "entregado"),
            ),
        ).scalar()
        ventas_por_mes.append({"mes": meses_es[mes_idx], "total": float(total_mes or 0)})

    filas_categoria = (
        db.session.query(Categoria.nombre, db.func.coalesce(db.func.sum(DetallePedido.cantidad), 0))
        .join(Producto, Producto.categoria_id == Categoria.id)
        .join(DetallePedido, DetallePedido.producto_id == Producto.id)
        .group_by(Categoria.id)
        .order_by(db.func.sum(DetallePedido.cantidad).desc())
        .limit(5)
        .all()
    )
    total_unidades_cat = sum(cantidad for _, cantidad in filas_categoria) or 1
    top_categorias = [
        {"nombre": nombre, "porcentaje": round(cantidad / total_unidades_cat * 100)}
        for nombre, cantidad in filas_categoria
    ]

    pedidos_recientes_query = (
        Pedido.query.options(joinedload(Pedido.cliente))
        .order_by(Pedido.fecha_creacion.desc())
        .limit(5)
        .all()
    )
    pedidos_recientes = []
    for p in pedidos_recientes_query:
        primer_detalle = p.detalles.first()
        cantidad_items = p.detalles.count()
        producto_resumen = primer_detalle.producto.nombre if primer_detalle and primer_detalle.producto else "—"
        if cantidad_items > 1:
            producto_resumen += f" y {cantidad_items - 1} más"
        pedidos_recientes.append({
            "numero_pedido": p.numero_pedido,
            "cliente": p.cliente.nombre_completo if p.cliente else (p.envio_nombre or "—"),
            "producto_resumen": producto_resumen,
            "total": float(p.total),
            "estado": p.estado,
            "estado_label": p.estado_label,
        })

    filas_top_productos = (
        db.session.query(
            Producto.id, Producto.nombre, Categoria.nombre,
            db.func.coalesce(db.func.sum(DetallePedido.subtotal), 0),
            db.func.coalesce(db.func.sum(DetallePedido.cantidad), 0),
        )
        .join(DetallePedido, DetallePedido.producto_id == Producto.id)
        .join(Categoria, Producto.categoria_id == Categoria.id)
        .group_by(Producto.id)
        .order_by(db.func.sum(DetallePedido.subtotal).desc())
        .limit(5)
        .all()
    )
    productos_top = [
        {
            "id": pid, "nombre": nombre, "categoria": categoria,
            "ingresos": float(ingresos), "unidades": int(unidades),
        }
        for pid, nombre, categoria, ingresos, unidades in filas_top_productos
    ]

    return jsonify({
        "total_pedidos": total_pedidos,
        "pedidos_pendientes": pendientes,
        "pagos_por_revisar": pagos_por_revisar,
        "reembolsos_pendientes": reembolsos_pendientes,
        "ventas_total": float(ventas_confirmadas or 0),
        "ventas_confirmadas": float(ventas_confirmadas or 0),
        "monto_pagos_pendientes": float(monto_pagos_pendientes or 0),
        "monto_en_revision": float(monto_en_revision or 0),
        "monto_rechazado": float(monto_rechazado or 0),
        "monto_reembolsos": float(monto_reembolsos or 0),
        "monto_cancelado": float(monto_cancelado or 0),
        "total_clientes": total_clientes,
        "total_productos": total_productos,
        "productos_bajo_stock": productos_bajo_stock,
        "ventas_por_mes": ventas_por_mes,
        "top_categorias": top_categorias,
        "pedidos_recientes": pedidos_recientes,
        "productos_top": productos_top,
    })

class _ItemVentaPresencial:
    """
    Envoltorio mínimo con la misma forma que ItemCarrito (producto_id, talla,
    color, cantidad, .producto, .subtotal) — así se reutilizan tal cual
    agrupar_por_producto/validar_stock_disponible/descontar_stock, que ya
    están probadas por el checkout público, en vez de duplicar esa lógica
    de stock para la venta presencial.
    """
    def __init__(self, producto_id, cantidad, talla, color, producto):
        self.producto_id = producto_id
        self.cantidad = cantidad
        self.talla = talla
        self.color = color
        self.producto = producto

    @property
    def subtotal(self):
        return round(self.producto.precio_final * self.cantidad, 2)


@bp.post("/venta-presencial")
@requiere_roles(*PUEDE_REGISTRAR_VENTA)
def venta_presencial():
    """
    Registra una venta hecha físicamente en la tienda (mostrador): el pago ya
    se recibió ahí mismo, así que el pedido se crea directamente como
    confirmado y con el pago verificado — a diferencia del checkout público,
    acá no hay pasarela ni nada que esperar.
    """
    data = request.get_json(force=True) or {}

    productos_data = data.get("productos") or []
    if not productos_data:
        return jsonify({"error": "Agrega al menos un producto a la venta"}), 400

    metodo_pago = data.get("metodo_pago")
    if metodo_pago not in Pedido.METODOS_PAGO:
        return jsonify({"error": "Método de pago inválido"}), 400

    items = []
    for p in productos_data:
        producto_id = p.get("producto_id")
        cantidad = p.get("cantidad")
        if not producto_id or not isinstance(cantidad, int) or cantidad < 1:
            return jsonify({"error": "Cada producto necesita un id y una cantidad válida"}), 400

        producto = Producto.query.get(producto_id)
        if not producto:
            return jsonify({"error": f"El producto con id {producto_id} ya no existe"}), 400

        items.append(_ItemVentaPresencial(
            producto_id=producto_id,
            cantidad=cantidad,
            talla=(p.get("talla") or None),
            color=(p.get("color") or None),
            producto=producto,
        ))

    grupos_stock, productos_cache = agrupar_por_producto(items)
    error_stock = validar_stock_disponible(grupos_stock, productos_cache)
    if error_stock:
        return jsonify({"error": error_stock}), 400

    subtotal = round(sum(item.subtotal for item in items), 2)

    pedido = Pedido(
        numero_pedido=Pedido.generar_numero(),
        usuario_id=None,
        origen="presencial",
        metodo_pago=metodo_pago,
        estado_pago="verificado",
        estado="confirmado",
        tipo_entrega="recojo",
        subtotal=subtotal,
        costo_envio=0,
        total=subtotal,
        envio_nombre=(data.get("cliente_nombre") or "").strip()[:160] or None,
        envio_telefono=(data.get("cliente_telefono") or "").strip()[:20] or None,
    )
    db.session.add(pedido)
    db.session.flush()  # para obtener pedido.id

    for item in items:
        variante = item.producto.variante_para(item.talla, item.color) if item.producto.usa_variantes else None
        db.session.add(DetallePedido(
            pedido_id=pedido.id,
            producto_id=item.producto_id,
            variante_id=variante.id if variante else None,
            cantidad=item.cantidad,
            precio_unit=item.producto.precio_final,
            talla=item.talla,
            color=item.color,
            subtotal=item.subtotal,
        ))

    error_descuento = descontar_stock(grupos_stock, productos_cache)
    if error_descuento:
        db.session.rollback()
        return jsonify({"error": error_descuento}), 409

    db.session.commit()
    return jsonify(pedido.to_dict())


@bp.get("/<int:pedido_id>/boleta")
@requiere_roles(*PUEDE_VER_PEDIDOS)
def boleta_pedido(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)

    if pedido.estado_pago != "verificado":
        return jsonify({"error": "Este pedido todavía no tiene el pago verificado"}), 400

    pdf_bytes = generar_pdf_boleta(pedido)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename=boleta-{pedido.numero_pedido}.pdf"},
    )