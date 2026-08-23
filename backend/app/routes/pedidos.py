from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import ItemCarrito, Pedido, DetallePedido, Producto, Usuario
from app.utils.stock import agrupar_por_producto, validar_stock_disponible, descontar_stock, restaurar_stock_de_pedido
from app.utils.decorators import requiere_activo
from app.utils.culqi import culqi_configurado, crear_cargo
from app.utils.boleta import generar_pdf_boleta

bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")

COSTO_ENVIO_DELIVERY = 10.00

# Tarjeta y Yape se cobran por la pasarela Culqi (cargo único, síncrono).
METODOS_PAGO_PASARELA = {"tarjeta", "yape"}


@bp.post("/checkout")
@requiere_activo
def checkout():
    usuario_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}

    # Idempotencia: si el cliente ya mandó este mismo checkout antes (doble
    # clic, reintento de red), devolvemos el pedido que ya se creó en vez de
    # crear uno duplicado. La clave la genera el frontend una vez por intento
    # de compra.
    idempotency_key = (data.get("idempotency_key") or "").strip()[:64] or None
    if idempotency_key:
        pedido_existente = Pedido.query.filter_by(
            usuario_id=usuario_id, idempotency_key=idempotency_key
        ).first()
        if pedido_existente:
            return jsonify(pedido_existente.to_dict()), 200

    items = ItemCarrito.query.filter_by(usuario_id=usuario_id).all()
    if not items:
        return jsonify({"error": "Tu carrito está vacío"}), 400

    metodo_pago = data.get("metodo_pago")
    if metodo_pago not in Pedido.METODOS_PAGO_DISPONIBLES:
        return jsonify({"error": "Método de pago inválido"}), 400

    tipo_entrega = data.get("tipo_entrega")
    if tipo_entrega not in Pedido.TIPOS_ENTREGA:
        return jsonify({"error": "Tipo de entrega inválido"}), 400

    # Nombre y teléfono de contacto son obligatorios siempre
    envio_nombre = (data.get("envio_nombre") or "").strip()[:160]
    envio_telefono = (data.get("envio_telefono") or "").strip()[:20]
    if not envio_nombre or not envio_telefono:
        return jsonify({"error": "Falta el nombre o el teléfono de contacto"}), 400

    # Si es delivery, la dirección (con distrito) es obligatoria — si es
    # recojo en tienda, no hace falta.
    envio_direccion = (data.get("envio_direccion") or "").strip()[:200]
    envio_distrito = (data.get("envio_distrito") or "").strip()[:100]
    if tipo_entrega == "delivery" and (not envio_direccion or not envio_distrito):
        return jsonify({"error": "Falta la dirección o el distrito de entrega"}), 400

    # Tarjeta: solo referencia visual, NUNCA se pide ni se acepta número de
    # tarjeta ni CVV — Culqi tokeniza esos datos directamente en el navegador
    # del cliente, nunca tocan nuestro servidor.
    tarjeta_titular = None
    if metodo_pago == "tarjeta":
        tarjeta_titular = (data.get("tarjeta_titular") or "").strip()[:160] or None

    # Validar stock antes de confirmar — respeta el stock por variante (talla/color)
    # cuando el producto lo usa, o el stock total del producto si no.
    grupos_stock, productos_cache = agrupar_por_producto(items)
    error_stock = validar_stock_disponible(grupos_stock, productos_cache)
    if error_stock:
        return jsonify({"error": error_stock}), 400

    subtotal = round(sum(item.subtotal for item in items), 2)
    costo_envio = COSTO_ENVIO_DELIVERY if tipo_entrega == "delivery" else 0
    total = round(subtotal + costo_envio, 2)

    pedido = Pedido(
        numero_pedido=Pedido.generar_numero(),
        usuario_id=usuario_id,
        idempotency_key=idempotency_key,
        metodo_pago=metodo_pago,
        # Tarjeta y Yape se cobran por Culqi: el frontend abre el widget de
        # Culqi justo después de crear el pedido y manda el token a
        # /pagar, así que arrancan "pendiente" hasta que se confirme el cobro.
        estado_pago="pendiente" if metodo_pago in METODOS_PAGO_PASARELA else "no_aplica",
        tipo_entrega=tipo_entrega,
        subtotal=subtotal,
        costo_envio=costo_envio,
        total=total,
        envio_nombre=envio_nombre,
        envio_telefono=envio_telefono,
        envio_direccion=envio_direccion or None,
        envio_distrito=envio_distrito or None,
        envio_provincia=(data.get("envio_provincia") or "").strip()[:100] or None,
        envio_dpto=(data.get("envio_dpto") or "").strip()[:100] or None,
        envio_referencia=(data.get("envio_referencia") or "").strip()[:200] or None,
        nota=(data.get("nota") or "").strip()[:500] or None,
        tarjeta_titular=tarjeta_titular,
    )

    db.session.add(pedido)
    db.session.flush()  # para obtener pedido.id

    for item in items:
        variante_id = None
        if item.producto and item.producto.usa_variantes:
            variante = item.producto.variante_para(item.talla, item.color)
            variante_id = variante.id if variante else None

        detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=item.producto_id,
            variante_id=variante_id,
            cantidad=item.cantidad,
            precio_unit=item.producto.precio_final,
            talla=item.talla,
            color=item.color,
            subtotal=item.subtotal,
        )
        db.session.add(detalle)
        db.session.delete(item)

    # Descuento de stock ATÓMICO a nivel de base de datos (por variante o por
    # producto, según corresponda) — evita sobreventa si dos compras del mismo
    # producto llegan casi al mismo tiempo.
    error_descuento = descontar_stock(grupos_stock, productos_cache)
    if error_descuento:
        db.session.rollback()
        return jsonify({"error": error_descuento}), 409

    db.session.commit()
    return jsonify(pedido.to_dict()), 201


@bp.get("")
@requiere_activo
def mis_pedidos():
    usuario_id = int(get_jwt_identity())
    pedidos = (
        Pedido.query.filter_by(usuario_id=usuario_id)
        .order_by(Pedido.fecha_creacion.desc())
        .all()
    )
    return jsonify([p.to_dict(con_detalles=False) for p in pedidos])


@bp.get("/<int:pedido_id>")
@requiere_activo
def detalle_pedido(pedido_id):
    usuario_id = int(get_jwt_identity())
    pedido = Pedido.query.filter_by(id=pedido_id, usuario_id=usuario_id).first_or_404()
    return jsonify(pedido.to_dict())


@bp.post("/<int:pedido_id>/cancelar")
@requiere_activo
def cancelar_pedido(pedido_id):
    usuario_id = int(get_jwt_identity())
    pedido = Pedido.query.filter_by(id=pedido_id, usuario_id=usuario_id).first_or_404()

    if not pedido.puede_pasar_a("cancelado"):
        return jsonify({
            "error": "Este pedido ya no se puede cancelar (ya está enviado, entregado o cancelado)"
        }), 400

    pedido.estado = "cancelado"
    # Si ya se le había confirmado el pago, ahora hay que devolverle su dinero.
    if pedido.estado_pago == "verificado":
        pedido.estado_pago = "reembolso_pendiente"
    restaurar_stock_de_pedido(pedido)
    db.session.commit()
    return jsonify(pedido.to_dict())


@bp.post("/<int:pedido_id>/pagar")
@requiere_activo
def pagar_pedido(pedido_id):
    """
    Cobra el pedido con Culqi usando el token que ya generó el widget en el
    frontend (tarjeta o Yape). A diferencia de TuPay, esto es SÍNCRONO: la
    respuesta de esta misma petición ya trae el resultado final (aprobado o
    rechazado) — no hay redirección ni webhook que esperar.
    """
    usuario_id = int(get_jwt_identity())
    usuario = Usuario.query.get(usuario_id)
    pedido = Pedido.query.filter_by(id=pedido_id, usuario_id=usuario_id).first_or_404()

    if pedido.metodo_pago not in METODOS_PAGO_PASARELA:
        return jsonify({"error": "Este pedido no se paga por pasarela"}), 400
    if pedido.estado == "cancelado":
        return jsonify({"error": "Este pedido está cancelado"}), 400
    if pedido.estado_pago != "pendiente":
        return jsonify({"error": "Este pedido ya no necesita pago por pasarela"}), 400

    data = request.get_json(force=True) or {}
    token_id = (data.get("token_id") or "").strip()
    if not token_id:
        return jsonify({"error": "Falta el token de pago generado por el checkout"}), 400

    if not culqi_configurado():
        return jsonify({"error": "El cobro automático todavía no está disponible, inténtalo más tarde"}), 503

    ok, cargo_id, error = crear_cargo(pedido, usuario, token_id, data.get("email"))
    if not ok:
        # Rechazo del banco o de Culqi — el pedido queda "pendiente" tal
        # cual, así el cliente puede intentar de nuevo (otra tarjeta, etc.)
        # sin que quede un pedido fantasma marcado como rechazado.
        return jsonify({"error": error}), 402

    pedido.culqi_cargo_id = cargo_id
    pedido.estado_pago = "verificado"
    if pedido.estado == "pendiente":
        pedido.estado = "confirmado"
    db.session.commit()
    return jsonify(pedido.to_dict())

@bp.get("/<int:pedido_id>/boleta")
@requiere_activo
def boleta_pedido(pedido_id):
    usuario_id = int(get_jwt_identity())
    pedido = Pedido.query.filter_by(id=pedido_id, usuario_id=usuario_id).first_or_404()

    if pedido.estado_pago != "verificado":
        return jsonify({"error": "Este pedido todavía no tiene el pago verificado"}), 400

    pdf_bytes = generar_pdf_boleta(pedido)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename=boleta-{pedido.numero_pedido}.pdf"},
    )
