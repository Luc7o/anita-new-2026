from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import db, limiter
from app.models import ItemCarrito, Producto
from app.utils.decorators import requiere_activo

bp = Blueprint("carrito", __name__, url_prefix="/api/carrito")

# Límites del carrito de invitado (vive en el navegador y el servidor solo lo
# valida): evitan que alguien mande miles de líneas a un endpoint público.
MAX_LINEAS_INVITADO = 50
MAX_CANTIDAD_LINEA = 99


def _resumen(usuario_id):
    items = ItemCarrito.query.filter_by(usuario_id=usuario_id).all()
    total = round(sum(item.subtotal for item in items), 2)
    return {
        "items": [item.to_dict() for item in items],
        "total_items": sum(item.cantidad for item in items),
        "total": total,
    }


def _ids_talla_color(producto, variante):
    """Los ids reales para filtrar ItemCarrito por esta variante — no se
    puede usar `.filter_by(talla=..., color=...)` porque talla/color ya no
    son columnas (son properties de compatibilidad), así que se resuelve a
    talla_id/color_id explícitamente."""
    talla_id = variante.talla_id if producto.tallas_lista else None
    color_id = variante.color_id if producto.colores_lista else None
    return talla_id, color_id


def _disponibilidad(producto, talla=None, color=None, usuario_id=None, excluir_item_id=None):
    """
    Calcula cuánto stock hay disponible para lo que se quiere agregar/actualizar,
    y cuánto de eso ya está apartado en el carrito del usuario.

    - Si el producto usa variantes (stock por talla/color), todo se calcula sobre
      esa variante específica.
    - Si no, se calcula sobre el stock total del producto, sumando todas las
      entradas del carrito para ese producto (sin importar talla/color).

    Devuelve (stock_disponible, ya_en_carrito) o (None, None) si la variante
    pedida no existe.
    """
    if producto.usa_variantes:
        variante = producto.variante_para(talla, color)
        if not variante:
            return None, None
        talla_id, color_id = _ids_talla_color(producto, variante)
        query = ItemCarrito.query.filter_by(
            usuario_id=usuario_id, producto_id=producto.id,
            talla_id=talla_id, color_id=color_id,
        )
        if excluir_item_id:
            query = query.filter(ItemCarrito.id != excluir_item_id)
        ya_en_carrito = sum(i.cantidad for i in query.all())
        return variante.stock, ya_en_carrito

    query = ItemCarrito.query.filter_by(usuario_id=usuario_id, producto_id=producto.id)
    if excluir_item_id:
        query = query.filter(ItemCarrito.id != excluir_item_id)
    ya_en_carrito = sum(i.cantidad for i in query.all())
    return producto.stock, ya_en_carrito


def _falta_elegir_opciones(producto, talla, color):
    """True si el producto exige talla y/o color y no se eligieron."""
    return bool(
        producto.usa_variantes
        and (producto.tallas_lista and not talla or producto.colores_lista and not color)
    )


def _mensaje_sin_stock(stock_disponible, ya_en_carrito):
    """Mensaje cuando lo que se quiere agregar no cabe en el stock."""
    disponible = max(stock_disponible - ya_en_carrito, 0)
    if ya_en_carrito > 0:
        return (
            f"Solo quedan {disponible} unidades disponibles"
            f" (ya tienes {ya_en_carrito} en tu carrito)."
        )
    return f"Solo hay {stock_disponible} unidades disponibles."


def _sumar_al_carrito(usuario_id, producto, cantidad, talla, color):
    """
    Agrega `cantidad` unidades al carrito del usuario (o las suma a la línea
    que ya exista para esa talla/color). NO hace commit.

    Devuelve None si todo salió bien, o un mensaje de error (str) si no se
    pudo agregar (falta elegir opciones, combinación inexistente o sin stock).
    """
    if _falta_elegir_opciones(producto, talla, color):
        return "Elige talla y/o color antes de agregar al carrito"

    stock_disponible, ya_en_carrito = _disponibilidad(
        producto, talla, color, usuario_id=usuario_id
    )
    if stock_disponible is None:
        return "Esa combinación de talla/color no está disponible"

    if ya_en_carrito + cantidad > stock_disponible:
        return _mensaje_sin_stock(stock_disponible, ya_en_carrito)

    item = None
    if producto.usa_variantes:
        variante_actual = producto.variante_para(talla, color)
        talla_id, color_id = _ids_talla_color(producto, variante_actual)
        item = ItemCarrito.query.filter_by(
            usuario_id=usuario_id, producto_id=producto.id,
            talla_id=talla_id, color_id=color_id,
        ).first()
    else:
        item = ItemCarrito.query.filter_by(
            usuario_id=usuario_id, producto_id=producto.id,
        ).first()

    if item:
        item.cantidad += cantidad
    else:
        item = ItemCarrito(usuario_id=usuario_id, producto_id=producto.id, cantidad=cantidad)
        if producto.usa_variantes:
            item.talla = talla if producto.tallas_lista else None
            item.color = color if producto.colores_lista else None
        db.session.add(item)
    return None


@bp.get("")
@requiere_activo
def ver_carrito():
    usuario_id = int(get_jwt_identity())
    return jsonify(_resumen(usuario_id))


@bp.post("/agregar")
@requiere_activo
def agregar_item():
    usuario_id = int(get_jwt_identity())
    data = request.get_json(force=True) or {}
    producto_id = data.get("producto_id")
    cantidad = int(data.get("cantidad", 1))
    talla = data.get("talla")
    color = data.get("color")

    if cantidad <= 0:
        return jsonify({"error": "La cantidad debe ser mayor a cero"}), 400

    producto = Producto.query.filter_by(id=producto_id, activo=True).first()
    if not producto:
        return jsonify({"error": "Producto no encontrado"}), 404

    error = _sumar_al_carrito(usuario_id, producto, cantidad, talla, color)
    if error:
        db.session.rollback()
        return jsonify({"error": error}), 400

    db.session.commit()
    return jsonify(_resumen(usuario_id)), 201


@bp.put("/<int:item_id>")
@requiere_activo
def actualizar_item(item_id):
    usuario_id = int(get_jwt_identity())
    item = ItemCarrito.query.filter_by(id=item_id, usuario_id=usuario_id).first_or_404()
    data = request.get_json(force=True) or {}

    nueva_cantidad = int(data.get("cantidad", item.cantidad))
    if nueva_cantidad <= 0:
        db.session.delete(item)
        db.session.commit()
        return jsonify(_resumen(usuario_id))

    stock_disponible, otras_unidades = _disponibilidad(
        item.producto, item.talla, item.color,
        usuario_id=usuario_id, excluir_item_id=item.id,
    )
    if stock_disponible is None:
        stock_disponible, otras_unidades = 0, 0

    if otras_unidades + nueva_cantidad > stock_disponible:
        disponible = max(stock_disponible - otras_unidades, 0)
        return jsonify({
            "error": f"Solo puedes tener hasta {disponible} unidades de esto en tu carrito"
        }), 400

    item.cantidad = nueva_cantidad
    db.session.commit()
    return jsonify(_resumen(usuario_id))


@bp.delete("/<int:item_id>")
@requiere_activo
def eliminar_item(item_id):
    usuario_id = int(get_jwt_identity())
    item = ItemCarrito.query.filter_by(id=item_id, usuario_id=usuario_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return jsonify(_resumen(usuario_id))


# ---------------------------------------------------------------------------
# Carrito de INVITADO (sin cuenta)
#
# El carrito de alguien que todavía no se registró vive en su navegador
# (localStorage) como una lista de líneas {key, producto_id, cantidad, talla,
# color}. El servidor NO guarda nada de eso: solo lo valida y lo "hidrata"
# con datos reales (nombre, imagen, precio vigente, stock), para que la
# pantalla muestre siempre la verdad y no lo que el navegador recordaba.
# Cuando la persona se registra o inicia sesión al pagar, /fusionar pasa esas
# líneas al carrito real de su cuenta.
# ---------------------------------------------------------------------------

def _texto_opcional(valor):
    """talla/color que llegan del navegador: str limpio o None."""
    if valor is None:
        return None
    valor = str(valor).strip()[:50]
    return valor or None


def _leer_lineas(data):
    """
    Normaliza las líneas que manda el navegador. Devuelve
    (lineas_validas, descartadas): una línea malformada no tumba todo el
    carrito, solo se descarta y se le avisa al frontend para que la quite.
    """
    crudas = data.get("items")
    if not isinstance(crudas, list):
        return None, None

    lineas, descartadas = [], []
    for posicion, cruda in enumerate(crudas[:MAX_LINEAS_INVITADO]):
        clave = str(cruda.get("key") if isinstance(cruda, dict) and cruda.get("key") else posicion)[:64]
        if not isinstance(cruda, dict):
            descartadas.append({"key": clave, "motivo": "Línea inválida"})
            continue
        try:
            producto_id = int(cruda.get("producto_id"))
            cantidad = int(cruda.get("cantidad", 1))
        except (TypeError, ValueError):
            descartadas.append({"key": clave, "motivo": "Línea inválida"})
            continue
        lineas.append({
            "key": clave,
            "producto_id": producto_id,
            "cantidad": max(1, min(cantidad, MAX_CANTIDAD_LINEA)),
            "talla": _texto_opcional(cruda.get("talla")),
            "color": _texto_opcional(cruda.get("color")),
        })
    return lineas, descartadas


@bp.post("/invitado/validar")
@limiter.limit("120 per minute")
def validar_carrito_invitado():
    """
    Recibe las líneas del carrito de un invitado y devuelve el mismo formato
    que GET /api/carrito, con datos reales y dos campos extra por línea:
    `disponible` (unidades que sí caben en el stock) y `problema` (texto si lo
    pedido no se puede cumplir, o null). El stock se reparte en orden entre
    las líneas que compiten por él, igual que en el carrito real.
    """
    data = request.get_json(silent=True) or {}
    lineas, descartadas = _leer_lineas(data)
    if lineas is None:
        return jsonify({"error": "Carrito inválido"}), 400
    if len(data.get("items")) > MAX_LINEAS_INVITADO:
        return jsonify({"error": f"El carrito admite hasta {MAX_LINEAS_INVITADO} productos distintos"}), 400

    productos = {}
    asignado = {}  # clave de stock -> unidades ya repartidas a líneas anteriores
    items = []

    for linea in lineas:
        producto = productos.get(linea["producto_id"])
        if producto is None:
            producto = Producto.query.filter_by(id=linea["producto_id"], activo=True).first()
            productos[linea["producto_id"]] = producto or False
        if not producto:
            descartadas.append({"key": linea["key"], "motivo": "Este producto ya no está disponible"})
            continue

        talla, color = linea["talla"], linea["color"]
        cantidad = linea["cantidad"]
        problema = None
        disponible = 0
        clave_stock, stock = None, 0

        if _falta_elegir_opciones(producto, talla, color):
            problema = "Elige talla y/o color"
        elif producto.usa_variantes:
            variante = producto.variante_para(talla, color)
            if not variante:
                problema = "Esa combinación de talla/color no está disponible"
            else:
                clave_stock, stock = ("v", variante.id), variante.stock
        else:
            clave_stock, stock = ("p", producto.id), producto.stock or 0

        if clave_stock is not None:
            ya = asignado.get(clave_stock, 0)
            disponible = max(stock - ya, 0)
            if cantidad > disponible:
                if stock <= 0:
                    problema = "Este producto está agotado."
                else:
                    problema = _mensaje_sin_stock(stock, ya)
            asignado[clave_stock] = ya + min(cantidad, disponible)

        items.append({
            "id": linea["key"],
            "producto": producto.to_dict(resumen=True),
            "cantidad": cantidad,
            "talla": talla if producto.tallas_lista else None,
            "color": color if producto.colores_lista else None,
            "subtotal": round(producto.precio_final * cantidad, 2),
            "disponible": disponible,
            "problema": problema,
        })

    return jsonify({
        "items": items,
        "total_items": sum(i["cantidad"] for i in items),
        "total": round(sum(i["subtotal"] for i in items), 2),
        "descartados": descartadas,
    })


@bp.post("/fusionar")
@requiere_activo
def fusionar_carrito_invitado():
    """
    Pasa las líneas del carrito de invitado al carrito real de la cuenta
    (se llama justo después de registrarse o iniciar sesión). Si algo ya no
    cabe en el stock, se agrega lo que alcance y se informa en `ajustes`, en
    vez de rechazar todo el carrito.
    """
    usuario_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    lineas, descartadas = _leer_lineas(data)
    if lineas is None:
        return jsonify({"error": "Carrito inválido"}), 400

    ajustes = [
        {"producto": None, "mensaje": d["motivo"]} for d in descartadas
    ]

    for linea in lineas:
        producto = Producto.query.filter_by(id=linea["producto_id"], activo=True).first()
        if not producto:
            ajustes.append({"producto": None, "mensaje": "Un producto de tu carrito ya no está disponible."})
            continue

        talla, color, cantidad = linea["talla"], linea["color"], linea["cantidad"]

        stock_disponible, ya_en_carrito = _disponibilidad(
            producto, talla, color, usuario_id=usuario_id
        )
        if _falta_elegir_opciones(producto, talla, color) or stock_disponible is None:
            ajustes.append({
                "producto": producto.nombre,
                "mensaje": f"{producto.nombre}: esa opción ya no está disponible.",
            })
            continue

        cabe = stock_disponible - ya_en_carrito
        if cabe <= 0:
            ajustes.append({
                "producto": producto.nombre,
                "mensaje": f"{producto.nombre}: se agotó y no se pudo agregar.",
            })
            continue

        a_agregar = min(cantidad, cabe)
        error = _sumar_al_carrito(usuario_id, producto, a_agregar, talla, color)
        if error:
            ajustes.append({"producto": producto.nombre, "mensaje": f"{producto.nombre}: {error}"})
            continue
        if a_agregar < cantidad:
            ajustes.append({
                "producto": producto.nombre,
                "mensaje": f"{producto.nombre}: solo pudimos agregar {a_agregar} de {cantidad} por falta de stock.",
            })

    db.session.commit()
    respuesta = _resumen(usuario_id)
    respuesta["ajustes"] = ajustes
    return jsonify(respuesta)
