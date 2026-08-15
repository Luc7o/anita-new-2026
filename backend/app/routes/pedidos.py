import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import ItemCarrito, Pedido, DetallePedido, Producto, ConfiguracionPago
from app.utils.imagenes import guardar_imagen, ImagenInvalida
from app.utils.stock import agrupar_por_producto, validar_stock_disponible, descontar_stock, restaurar_stock_de_pedido
from app.utils.decorators import requiere_activo

bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")

COSTO_ENVIO_DELIVERY = 10.00

# Métodos que exigen comprobante de pago subido por el cliente para completar la compra
METODOS_CON_COMPROBANTE = {"yape"}

# Métodos que quedan con estado_pago "pendiente" para seguimiento manual del admin
# (tarjeta hasta que haya una pasarela de pago real conectada)
METODOS_PAGO_MANUAL = {"tarjeta"}


@bp.post("/checkout")
@requiere_activo
def checkout():
    usuario_id = int(get_jwt_identity())

    # El checkout llega como multipart/form-data cuando incluye un comprobante
    # (campo "datos" con el JSON del pedido + campo "comprobante" con el archivo).
    # Si no hay archivo, también aceptamos JSON normal (tarjeta / contra entrega).
    archivo_comprobante = request.files.get("comprobante")
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        try:
            data = json.loads(request.form.get("datos", "{}"))
        except ValueError:
            return jsonify({"error": "Datos del pedido inválidos"}), 400
    else:
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

    # El comprobante es obligatorio para completar la compra con Yape
    if metodo_pago in METODOS_CON_COMPROBANTE and not archivo_comprobante:
        return jsonify({
            "error": "Debes subir tu comprobante de pago de Yape para completar la compra"
        }), 400

    # Tarjeta: solo coordinamos el cobro manualmente. NUNCA se pide ni se
    # acepta número de tarjeta ni CVV — solo un nombre de contacto opcional.
    tarjeta_titular = None
    if metodo_pago == "tarjeta":
        tarjeta_titular = (data.get("tarjeta_titular") or "").strip()[:160] or None

    if archivo_comprobante:
        # Validamos que sea una imagen válida antes de crear el pedido, para no
        # dejar pedidos a medio hacer si el archivo subido está corrupto.
        if archivo_comprobante.filename == "":
            return jsonify({"error": "El comprobante que enviaste está vacío"}), 400

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
        estado_pago="pendiente" if metodo_pago in METODOS_PAGO_MANUAL else "no_aplica",
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

    if archivo_comprobante:
        try:
            url = guardar_imagen(archivo_comprobante, "comprobantes")
        except ImagenInvalida as e:
            return jsonify({"error": str(e)}), 400
        pedido.comprobante_url = url
        pedido.estado_pago = "en_revision"

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


@bp.post("/<int:pedido_id>/comprobante")
@requiere_activo
def subir_comprobante(pedido_id):
    usuario_id = int(get_jwt_identity())
    pedido = Pedido.query.filter_by(id=pedido_id, usuario_id=usuario_id).first_or_404()

    if pedido.metodo_pago not in METODOS_CON_COMPROBANTE:
        return jsonify({"error": "Este pedido no requiere comprobante"}), 400

    if pedido.estado == "cancelado":
        return jsonify({"error": "Este pedido está cancelado, ya no se puede modificar"}), 400

    try:
        url = guardar_imagen(request.files.get("comprobante"), "comprobantes")
    except ImagenInvalida as e:
        return jsonify({"error": str(e)}), 400

    pedido.comprobante_url = url
    pedido.estado_pago = "en_revision"
    db.session.commit()
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


@bp.get("/config/pago")
def configuracion_pago_publica():
    """Datos públicos para mostrar el QR/número de Yape en el checkout."""
    config = ConfiguracionPago.obtener()
    return jsonify(config.to_dict())
