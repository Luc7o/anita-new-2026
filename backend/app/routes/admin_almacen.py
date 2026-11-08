from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models import Producto, Categoria
from app.roles import PUEDE_VER_ALMACEN, PUEDE_AJUSTAR_STOCK
from app.utils.almacen import ErrorAlmacen, registrar_ajuste, aplicar_inventario_fisico
from app.utils.decorators import requiere_roles
from app.utils.busqueda import contiene

bp = Blueprint("admin_almacen", __name__, url_prefix="/api/admin/almacen")

POR_PAGINA_MAX = 100
MAX_STOCK_MINIMO = 100000


def _fila_producto(p):
    return {
        "producto_id": p.id,
        "nombre": p.nombre,
        "sku": p.sku,
        "categoria": p.categoria.nombre if p.categoria else None,
        "imagen_url": p.imagen_principal,
        "activo": bool(p.activo),
        "stock_total": p.stock_total,
        "stock_minimo": p.stock_minimo if p.stock_minimo is not None else 3,
        "estado": p.estado_stock,
        "costo_promedio": float(p.costo_promedio) if p.costo_promedio is not None else None,
        "variantes": [
            {"variante_id": v.id, "talla": v.talla, "color": v.color, "stock": v.stock}
            for v in p.variantes
        ],
    }


@bp.get("/stock")
@requiere_roles(*PUEDE_VER_ALMACEN)
def stock():
    """
    Stock actual por producto (con el desglose por talla y color), con su stock
    mínimo y su estado. Filtros: q (nombre o SKU), estado (agotado, bajo, ok),
    categoria_id, activo (true o false, por defecto solo activos), pagina, por_pagina.
    Además devuelve el resumen de cuántos hay en cada estado (con el filtro de q y categoría).
    """
    query = Producto.query.options(
        joinedload(Producto.categoria),
        selectinload(Producto.imagenes),
        selectinload(Producto.variantes),
    )

    activo = request.args.get("activo", "true")
    if activo in ("true", "false"):
        query = query.filter(Producto.activo == (activo == "true"))

    q = (request.args.get("q") or "").strip()[:100]
    if q:
        query = query.filter(or_(contiene(Producto.nombre, f"%{q}%"), Producto.sku.ilike(f"%{q}%")))

    categoria_id = request.args.get("categoria_id", type=int)
    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)

    estado = request.args.get("estado")
    if estado and estado not in ("agotado", "bajo", "ok"):
        return jsonify({"error": "Estado no válido"}), 400

    # El estado depende del stock total (suma de variantes) y se calcula en Python;
    # el catálogo de una tienda es chico, así que se filtra y pagina en memoria.
    productos = query.order_by(Producto.nombre.asc()).all()
    resumen = {"agotado": 0, "bajo": 0, "ok": 0}
    for p in productos:
        resumen[p.estado_stock] += 1
    if estado:
        productos = [p for p in productos if p.estado_stock == estado]

    pagina = max(request.args.get("pagina", 1, type=int), 1)
    por_pagina = min(max(request.args.get("por_pagina", 20, type=int), 1), POR_PAGINA_MAX)
    total = len(productos)
    pagina_items = productos[(pagina - 1) * por_pagina: pagina * por_pagina]

    return jsonify({
        "productos": [_fila_producto(p) for p in pagina_items],
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "paginas": max((total + por_pagina - 1) // por_pagina, 1),
        "resumen": resumen,
    })


@bp.put("/stock-minimo/<int:producto_id>")
@requiere_roles(*PUEDE_AJUSTAR_STOCK)
def cambiar_stock_minimo(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    data = request.get_json(silent=True) or {}
    valor = data.get("stock_minimo")
    try:
        if isinstance(valor, bool) or (isinstance(valor, float) and not valor.is_integer()):
            raise ValueError
        minimo = int(valor)
    except (TypeError, ValueError):
        return jsonify({"error": "El stock mínimo debe ser un número entero"}), 400
    if minimo < 0 or minimo > MAX_STOCK_MINIMO:
        return jsonify({"error": f"El stock mínimo debe estar entre 0 y {MAX_STOCK_MINIMO}"}), 400

    producto.stock_minimo = minimo
    db.session.commit()
    return jsonify(_fila_producto(producto))


@bp.post("/ajustes")
@requiere_roles(*PUEDE_AJUSTAR_STOCK)
def ajustar():
    """Merma (saca stock) o ajuste puntual (suma o resta) de una variante, con motivo obligatorio."""
    data = request.get_json(silent=True) or {}
    try:
        movimiento = registrar_ajuste(data, g.usuario.id)
        db.session.commit()
    except ErrorAlmacen as e:
        db.session.rollback()
        return jsonify({"error": e.mensaje}), e.status
    except Exception:
        db.session.rollback()
        raise
    return jsonify(movimiento.to_dict()), 201


@bp.post("/inventario-fisico")
@requiere_roles(*PUEDE_AJUSTAR_STOCK)
def inventario_fisico():
    """Aplica un conteo físico: ajusta el stock de las líneas que tienen diferencia."""
    data = request.get_json(silent=True) or {}
    try:
        movimientos, sin_diferencia = aplicar_inventario_fisico(data, g.usuario.id)
        db.session.commit()
    except ErrorAlmacen as e:
        db.session.rollback()
        return jsonify({"error": e.mensaje}), e.status
    except Exception:
        db.session.rollback()
        raise
    return jsonify({
        "ajustados": len(movimientos),
        "sin_diferencia": sin_diferencia,
        "unidades_netas": sum(m.cantidad for m in movimientos),
    })
