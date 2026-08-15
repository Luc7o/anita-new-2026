from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import ItemCarrito, Producto
from app.utils.decorators import requiere_activo

bp = Blueprint("carrito", __name__, url_prefix="/api/carrito")


def _resumen(usuario_id):
    items = ItemCarrito.query.filter_by(usuario_id=usuario_id).all()
    total = round(sum(item.subtotal for item in items), 2)
    return {
        "items": [item.to_dict() for item in items],
        "total_items": sum(item.cantidad for item in items),
        "total": total,
    }


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
        query = ItemCarrito.query.filter_by(
            usuario_id=usuario_id, producto_id=producto.id,
            talla=talla if producto.tallas_lista else None,
            color=color if producto.colores_lista else None,
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

    if producto.usa_variantes and (producto.tallas_lista and not talla or producto.colores_lista and not color):
        return jsonify({"error": "Elige talla y/o color antes de agregar al carrito"}), 400

    stock_disponible, ya_en_carrito = _disponibilidad(
        producto, talla, color, usuario_id=usuario_id
    )
    if stock_disponible is None:
        return jsonify({"error": "Esa combinación de talla/color no está disponible"}), 400

    if ya_en_carrito + cantidad > stock_disponible:
        disponible = max(stock_disponible - ya_en_carrito, 0)
        return jsonify({
            "error": f"Solo quedan {disponible} unidades disponibles"
                     f" (ya tienes {ya_en_carrito} en tu carrito)."
                     if ya_en_carrito > 0 else
                     f"Solo hay {stock_disponible} unidades disponibles."
        }), 400

    item = ItemCarrito.query.filter_by(
        usuario_id=usuario_id, producto_id=producto_id, talla=talla, color=color,
    ).first()

    if item:
        item.cantidad += cantidad
    else:
        item = ItemCarrito(
            usuario_id=usuario_id, producto_id=producto_id,
            cantidad=cantidad, talla=talla, color=color,
        )
        db.session.add(item)

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
