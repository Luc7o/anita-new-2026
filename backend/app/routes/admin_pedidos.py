from flask import Blueprint, request, jsonify
from sqlalchemy.orm import selectinload, joinedload
from app.extensions import db
from app.models import Pedido, Usuario, Producto
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_PEDIDOS, PUEDE_GESTIONAR_PEDIDOS, PUEDE_VER_DASHBOARD
from app.utils.stock import restaurar_stock_de_pedido

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
@requiere_roles(*PUEDE_GESTIONAR_PEDIDOS)
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

    # "Ventas confirmadas" = dinero que REALMENTE se cobró: pago verificado,
    # o métodos que no requieren verificación (contra entrega histórico) pero
    # solo una vez que el pedido efectivamente se entregó. NO incluye pagos
    # pendientes, en revisión ni rechazados — eso no es plata cobrada todavía.
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

    return jsonify({
        "total_pedidos": total_pedidos,
        "pedidos_pendientes": pendientes,
        "pagos_por_revisar": pagos_por_revisar,
        "reembolsos_pendientes": reembolsos_pendientes,
        # Ventas confirmadas (dinero efectivamente cobrado) — este es el número
        # que debe mostrarse como "ventas" en el dashboard.
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
    })
