from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import Producto, Categoria, ImagenProducto, VarianteProducto
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_PRODUCTOS, PUEDE_GESTIONAR_PRODUCTOS

bp = Blueprint("admin_productos", __name__, url_prefix="/api/admin/productos")

MINIMO_IMAGENES = 4


def _validar_imagenes(imagenes):
    if not isinstance(imagenes, list) or len(imagenes) < MINIMO_IMAGENES:
        return f"El producto necesita al menos {MINIMO_IMAGENES} imágenes"
    for img in imagenes:
        if not img.get("url"):
            return "Una de las imágenes no tiene URL"
    return None


def _guardar_imagenes(producto, imagenes):
    ImagenProducto.query.filter_by(producto_id=producto.id).delete()
    for i, img in enumerate(imagenes):
        db.session.add(ImagenProducto(
            producto_id=producto.id,
            url=img["url"],
            color=img.get("color") or None,
            orden=i,
        ))


def _validar_precio_stock(data):
    if "precio" in data and data["precio"] not in (None, ""):
        try:
            if float(data["precio"]) < 0:
                return "El precio no puede ser negativo"
        except (TypeError, ValueError):
            return "El precio no es un número válido"

    if data.get("precio_oferta") not in (None, ""):
        try:
            oferta = float(data["precio_oferta"])
        except (TypeError, ValueError):
            return "El precio de oferta no es un número válido"
        if oferta < 0:
            return "El precio de oferta no puede ser negativo"
        precio_actual = data.get("precio")
        if precio_actual not in (None, "") and oferta >= float(precio_actual):
            return "El precio de oferta debe ser menor al precio normal"

    if "stock" in data and data["stock"] not in (None, ""):
        try:
            if int(data["stock"]) < 0:
                return "El stock no puede ser negativo"
        except (TypeError, ValueError):
            return "El stock no es un número válido"

    return None


def _combos_esperados(tallas, colores):
    """Calcula qué combinaciones de talla/color debería tener el producto."""
    if tallas and colores:
        return {(t, c) for t in tallas for c in colores}
    if tallas:
        return {(t, "") for t in tallas}
    if colores:
        return {("", c) for c in colores}
    return set()


def _validar_variantes(tallas, colores, variantes):
    """
    Si el producto tiene tallas y/o colores, exige que venga el stock de
    CADA combinación posible — ni una de más, ni una de menos.
    Si no tiene tallas ni colores, no debería mandarse ninguna variante
    (ese producto usa el campo "stock" simple).
    """
    combos_esperados = _combos_esperados(tallas, colores)

    if not combos_esperados:
        return None  # producto simple, no necesita variantes

    if not isinstance(variantes, list) or len(variantes) == 0:
        return "Este producto tiene tallas y/o colores: define el stock de cada combinación"

    combos_recibidos = set()
    for v in variantes:
        if not isinstance(v.get("stock"), int) or v["stock"] < 0:
            return "El stock de cada variante debe ser un número entero mayor o igual a 0"
        combos_recibidos.add((v.get("talla") or "", v.get("color") or ""))

    if combos_recibidos != combos_esperados:
        return "Las variantes no coinciden con las tallas/colores del producto — revisa que estén todas"

    return None


def _guardar_variantes(producto, tallas, colores, variantes):
    VarianteProducto.query.filter_by(producto_id=producto.id).delete()
    if not _combos_esperados(tallas, colores):
        return  # producto simple: no guarda variantes
    for v in variantes:
        db.session.add(VarianteProducto(
            producto_id=producto.id,
            talla=v.get("talla") or "",
            color=v.get("color") or "",
            stock=v["stock"],
        ))


@bp.get("")
@requiere_roles(*PUEDE_VER_PRODUCTOS)
def listar():
    query = Producto.query.options(
        joinedload(Producto.categoria),
        selectinload(Producto.imagenes),
        selectinload(Producto.variantes),
        selectinload(Producto.resenas),
    )

    categoria_slug = request.args.get("categoria")
    if categoria_slug:
        query = query.join(Categoria).filter(Categoria.slug == categoria_slug)

    busqueda = (request.args.get("q") or "")[:100] or None
    if busqueda:
        query = query.filter(Producto.nombre.ilike(f"%{busqueda}%"))

    pagina = max(request.args.get("pagina", 1, type=int) or 1, 1)
    por_pagina = min(max(request.args.get("por_pagina", 20, type=int) or 20, 1), 100)
    paginado = query.order_by(Producto.fecha_creacion.desc()).paginate(
        page=pagina, per_page=por_pagina, error_out=False
    )

    return jsonify({
        "productos": [p.to_dict(resumen=True) for p in paginado.items],
        "total": paginado.total,
        "paginas": paginado.pages,
        "pagina_actual": paginado.page,
    })


@bp.get("/<int:producto_id>")
@requiere_roles(*PUEDE_VER_PRODUCTOS)
def detalle(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    return jsonify(producto.to_dict())


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_PRODUCTOS)
def crear():
    data = request.get_json(force=True) or {}

    campos_requeridos = ["nombre", "precio", "categoria_id"]
    faltantes = [c for c in campos_requeridos if data.get(c) in (None, "")]
    if faltantes:
        return jsonify({"error": f"Faltan campos: {', '.join(faltantes)}"}), 400

    if not Categoria.query.get(data["categoria_id"]):
        return jsonify({"error": "Categoría no válida"}), 400

    error_precio = _validar_precio_stock(data)
    if error_precio:
        return jsonify({"error": error_precio}), 400

    error_imagenes = _validar_imagenes(data.get("imagenes"))
    if error_imagenes:
        return jsonify({"error": error_imagenes}), 400

    tallas = data.get("tallas") or []
    colores = data.get("colores") or []
    error_variantes = _validar_variantes(tallas, colores, data.get("variantes"))
    if error_variantes:
        return jsonify({"error": error_variantes}), 400

    producto = Producto(
        nombre=data["nombre"],
        descripcion=data.get("descripcion", ""),
        precio=data["precio"],
        precio_oferta=data.get("precio_oferta") or None,
        stock=data.get("stock", 0),
        sku=data.get("sku") or None,
        tallas=",".join(tallas) if tallas else None,
        colores=",".join(colores) if colores else None,
        categoria_id=data["categoria_id"],
        destacado=bool(data.get("destacado", False)),
        es_nuevo=bool(data.get("es_nuevo", True)),
        activo=bool(data.get("activo", True)),
    )
    db.session.add(producto)

    try:
        db.session.flush()  # para tener producto.id antes de guardar imágenes/variantes; aquí puede fallar el SKU duplicado
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ya existe un producto con ese SKU"}), 409

    _guardar_imagenes(producto, data["imagenes"])
    _guardar_variantes(producto, tallas, colores, data.get("variantes") or [])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ya existe un producto con ese SKU"}), 409

    return jsonify(producto.to_dict()), 201


@bp.put("/<int:producto_id>")
@requiere_roles(*PUEDE_GESTIONAR_PRODUCTOS)
def actualizar(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    data = request.get_json(force=True) or {}

    if "categoria_id" in data and not Categoria.query.get(data["categoria_id"]):
        return jsonify({"error": "Categoría no válida"}), 400

    error_precio = _validar_precio_stock(data)
    if error_precio:
        return jsonify({"error": error_precio}), 400

    campos_directos = [
        "nombre", "descripcion", "precio", "precio_oferta", "stock",
        "sku", "categoria_id", "destacado", "es_nuevo", "activo",
    ]
    for campo in campos_directos:
        if campo in data:
            setattr(producto, campo, data[campo] if data[campo] != "" else None)

    tallas = data["tallas"] if "tallas" in data else producto.tallas_lista
    colores = data["colores"] if "colores" in data else producto.colores_lista

    if "tallas" in data:
        producto.tallas = ",".join(tallas) if tallas else None
    if "colores" in data:
        producto.colores = ",".join(colores) if colores else None

    # Si cambian tallas/colores, o si mandan variantes explícitamente, revalidamos
    if "tallas" in data or "colores" in data or "variantes" in data:
        error_variantes = _validar_variantes(tallas, colores, data.get("variantes"))
        if error_variantes:
            return jsonify({"error": error_variantes}), 400
        _guardar_variantes(producto, tallas, colores, data.get("variantes") or [])

    if "imagenes" in data:
        error_imagenes = _validar_imagenes(data["imagenes"])
        if error_imagenes:
            return jsonify({"error": error_imagenes}), 400
        _guardar_imagenes(producto, data["imagenes"])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ya existe un producto con ese SKU"}), 409

    return jsonify(producto.to_dict())


@bp.delete("/<int:producto_id>")
@requiere_roles(*PUEDE_GESTIONAR_PRODUCTOS)
def eliminar(producto_id):
    """Desactiva el producto (no lo borra, para no romper pedidos históricos)."""
    producto = Producto.query.get_or_404(producto_id)
    producto.activo = False
    db.session.commit()
    return jsonify({"mensaje": "Producto desactivado"})
