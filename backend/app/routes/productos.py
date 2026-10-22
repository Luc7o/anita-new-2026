from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db, limiter
from app.models import Producto, Categoria, Resena, DetallePedido, Pedido, VarianteProducto, Talla, Color
from app.models.producto import GENEROS
from app.utils.decorators import requiere_activo
from app.utils.cache import cache_publico

bp = Blueprint("productos", __name__, url_prefix="/api")


def _variantes_termino(termino):
    """Formas a buscar de una palabra: ella misma y su singular simple
    (mochilas -> mochila, carteras -> cartera, vestidos -> vestido), así
    buscar en plural encuentra productos nombrados en singular."""
    formas = {termino}
    if len(termino) > 3 and termino.endswith("es"):
        formas.add(termino[:-2])
    if len(termino) > 3 and termino.endswith("s"):
        formas.add(termino[:-1])
    return formas


def _filtro_busqueda(texto):
    """
    Búsqueda del catálogo: cada palabra escrita debe aparecer en el nombre,
    la descripción, el SKU o el nombre de la categoría del producto. Ejemplos:
    "mochilas" encuentra "Mochila Urbana" (por plural y por categoría),
    "rop-000012" encuentra por SKU y "botines negros" exige ambas palabras.
    """
    condiciones = []
    for palabra in texto.split()[:6]:
        palabra = palabra.lower()
        opciones = []
        for forma in _variantes_termino(palabra):
            patron = "%" + forma.replace("/", "//").replace("%", "/%").replace("_", "/_") + "%"
            opciones += [
                Producto.nombre.ilike(patron, escape="/"),
                Producto.descripcion.ilike(patron, escape="/"),
                Producto.sku.ilike(patron, escape="/"),
                Producto.categoria.has(Categoria.nombre.ilike(patron, escape="/")),
            ]
        condiciones.append(db.or_(*opciones))
    return db.and_(*condiciones)


def _numero(valor):
    """Número >= 0 de un parámetro de la URL, o None si falta o no es válido."""
    try:
        n = float(valor)
    except (TypeError, ValueError):
        return None
    return n if n >= 0 else None


@bp.get("/filtros")
@cache_publico(ttl=300, navegador=60)
def opciones_filtros():
    """Lo que la tienda necesita para armar sus filtros: rango de precios real,
    colores y géneros que realmente existen entre los productos activos."""
    precio_final = func.coalesce(Producto.precio_oferta, Producto.precio)
    minimo, maximo = db.session.query(func.min(precio_final), func.max(precio_final)).filter(
        Producto.activo.is_(True)
    ).one()

    colores = (
        db.session.query(Color.nombre)
        .join(VarianteProducto, VarianteProducto.color_id == Color.id)
        .join(Producto, Producto.id == VarianteProducto.producto_id)
        .filter(Producto.activo.is_(True), VarianteProducto.stock > 0, Color.nombre != "")
        .distinct()
        .order_by(Color.nombre)
        .all()
    )
    generos = [
        g for (g,) in db.session.query(Producto.genero)
        .filter(Producto.activo.is_(True), Producto.genero.isnot(None))
        .distinct()
        .all()
    ]
    return jsonify({
        "precio": {
            "min": int(float(minimo)) if minimo is not None else 0,
            "max": int(-(-float(maximo) // 1)) if maximo is not None else 0,
        },
        "colores": [c for (c,) in colores],
        "generos": [{"valor": k, "etiqueta": v} for k, v in GENEROS.items() if k in generos],
    })


@bp.get("/categorias")
@cache_publico(ttl=300, navegador=60)
def listar_categorias():
    categorias = Categoria.query.filter_by(activo=True).all()
    return jsonify([c.to_dict() for c in categorias])


@bp.get("/productos")
@cache_publico(ttl=60, navegador=30)
def listar_productos():
    query = Producto.query.filter_by(activo=True).options(
        joinedload(Producto.categoria),
        selectinload(Producto.imagenes),
        selectinload(Producto.variantes),
        selectinload(Producto.resenas),
    )

    categoria_slug = request.args.get("categoria")
    if categoria_slug:
        slugs = [s.strip() for s in categoria_slug.split(",") if s.strip()]
        if slugs:
            query = query.join(Categoria).filter(Categoria.slug.in_(slugs))

    # --- Precio (sobre el precio que realmente paga el cliente: oferta si hay)
    precio_final = func.coalesce(Producto.precio_oferta, Producto.precio)
    precio_min = _numero(request.args.get("precio_min"))
    precio_max = _numero(request.args.get("precio_max"))
    if precio_min is not None:
        query = query.filter(precio_final >= precio_min)
    if precio_max is not None:
        query = query.filter(precio_final <= precio_max)

    # --- Tallas y colores: tiene que existir UNA misma variante con stock que
    # cumpla todo lo elegido. Así "talla 35 + color Vino" solo muestra productos
    # que hoy tienen la 35 en Vino disponible (no una 39 en Vino y una 35 en
    # Negro), y una talla o color agotados no cuentan.
    tallas_pedidas = [t.strip().lower() for t in (request.args.get("tallas") or "").split(",") if t.strip()]
    colores = [c.strip().lower() for c in (request.args.get("colores") or "").split(",") if c.strip()]
    if tallas_pedidas or colores:
        condiciones = [VarianteProducto.stock > 0]
        if tallas_pedidas:
            condiciones.append(VarianteProducto.talla_obj.has(func.lower(Talla.nombre).in_(tallas_pedidas)))
        if colores:
            condiciones.append(VarianteProducto.color_obj.has(func.lower(Color.nombre).in_(colores)))
        query = query.filter(Producto.variantes.any(db.and_(*condiciones)))

    # --- Calificación promedio mínima (1 a 5). Sin reseñas no tiene promedio.
    calificacion = request.args.get("calificacion", type=int)
    if calificacion and 1 <= calificacion <= 5:
        con_promedio = (
            db.session.query(Resena.producto_id)
            .group_by(Resena.producto_id)
            .having(func.avg(Resena.calificacion) >= calificacion)
        )
        query = query.filter(Producto.id.in_(con_promedio))

    # --- Género
    generos = [g.strip() for g in (request.args.get("genero") or "").split(",") if g.strip() in GENEROS]
    if generos:
        query = query.filter(Producto.genero.in_(generos))

    busqueda = (request.args.get("q") or "").strip()[:100] or None
    if busqueda:
        query = query.filter(_filtro_busqueda(busqueda))

    if request.args.get("destacado") == "true":
        query = query.filter_by(destacado=True)
    if request.args.get("nuevo") == "true":
        query = query.filter_by(es_nuevo=True)
    if request.args.get("oferta") == "true":
        query = query.filter(Producto.precio_oferta.isnot(None))

    orden = request.args.get("orden")
    if orden == "precio_asc":
        query = query.order_by(Producto.precio.asc())
    elif orden == "precio_desc":
        query = query.order_by(Producto.precio.desc())
    else:
        query = query.order_by(Producto.fecha_creacion.desc())

    pagina = max(request.args.get("pagina", 1, type=int) or 1, 1)
    por_pagina = min(max(request.args.get("por_pagina", 12, type=int) or 12, 1), 48)
    paginado = query.paginate(page=pagina, per_page=por_pagina, error_out=False)

    return jsonify({
        "productos": [p.to_dict(resumen=True) for p in paginado.items],
        "total": paginado.total,
        "paginas": paginado.pages,
        "pagina_actual": paginado.page,
    })


@bp.get("/productos/<int:producto_id>")
@cache_publico(ttl=60, navegador=30)
def detalle_producto(producto_id):
    producto = Producto.query.filter_by(id=producto_id, activo=True).first_or_404()
    return jsonify(producto.to_dict())


def _compro_este_producto(usuario_id, producto_id):
    """
    True si el usuario tiene un pedido con este producto y el pago realmente
    se confirmó (no alcanza con que el pedido no esté cancelado: un pago
    pendiente, en revisión o rechazado no cuenta como compra válida).
    """
    existe = (
        db.session.query(DetallePedido.id)
        .join(Pedido, Pedido.id == DetallePedido.pedido_id)
        .filter(
            DetallePedido.producto_id == producto_id,
            Pedido.usuario_id == usuario_id,
            Pedido.estado != "cancelado",
            db.or_(
                Pedido.estado_pago == "verificado",
                db.and_(Pedido.estado_pago == "no_aplica", Pedido.estado == "entregado"),
            ),
        )
        .first()
    )
    return existe is not None


@bp.get("/productos/<int:producto_id>/resenas")
@cache_publico(ttl=60, navegador=30)
def listar_resenas(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    resenas = sorted(producto.resenas, key=lambda r: r.fecha_creacion, reverse=True)
    return jsonify({
        "resenas": [r.to_dict() for r in resenas],
        "promedio": producto.promedio_calificacion,
        "total": producto.total_resenas,
    })


@bp.get("/resenas")
@cache_publico(ttl=120, navegador=60)
def listar_resenas_recientes():
    """Reseñas reales de toda la tienda (página pública "Reviews de clientes").

    Lee directo de la tabla `resenas`, así que una reseña nueva aparece en
    cuanto se guarda. Solo cuentan productos activos. Del autor se expone
    únicamente el nombre y la inicial del apellido (nunca correo ni datos
    de contacto).
    """
    limite = min(max(request.args.get("limite", 12, type=int), 1), 50)
    offset = max(request.args.get("offset", 0, type=int), 0)

    solo_activos = Producto.activo.is_(True)

    total = (
        db.session.query(func.count(Resena.id))
        .join(Producto, Producto.id == Resena.producto_id)
        .filter(solo_activos)
        .scalar()
    ) or 0

    promedio = None
    distribucion = {str(n): 0 for n in range(1, 6)}
    if total:
        promedio = (
            db.session.query(func.avg(Resena.calificacion))
            .join(Producto, Producto.id == Resena.producto_id)
            .filter(solo_activos)
            .scalar()
        )
        filas_dist = (
            db.session.query(Resena.calificacion, func.count(Resena.id))
            .join(Producto, Producto.id == Resena.producto_id)
            .filter(solo_activos)
            .group_by(Resena.calificacion)
            .all()
        )
        for calificacion, cantidad in filas_dist:
            distribucion[str(calificacion)] = cantidad

    filas = (
        db.session.query(Resena, Producto)
        .join(Producto, Producto.id == Resena.producto_id)
        .filter(solo_activos)
        .options(joinedload(Resena.usuario), selectinload(Producto.imagenes))
        .order_by(Resena.fecha_creacion.desc(), Resena.id.desc())
        .offset(offset)
        .limit(limite)
        .all()
    )

    resenas = []
    for resena, producto in filas:
        usuario = resena.usuario
        if usuario:
            inicial = f" {usuario.apellido[0]}." if usuario.apellido else ""
            autor = f"{usuario.nombre}{inicial}"
        else:
            autor = "Cliente"
        resenas.append({
            "id": resena.id,
            "autor": autor,
            "calificacion": resena.calificacion,
            "comentario": resena.comentario,
            "compra_verificada": bool(resena.compra_verificada),
            "fecha_creacion": resena.fecha_creacion.isoformat(),
            "producto": {
                "id": producto.id,
                "nombre": producto.nombre,
                "imagen_url": producto.imagen_principal,
            },
        })

    return jsonify({
        "resenas": resenas,
        "total": total,
        "promedio": round(float(promedio), 1) if promedio is not None else None,
        "distribucion": distribucion,
        "hay_mas": offset + len(resenas) < total,
    })


@bp.post("/productos/<int:producto_id>/resenas")
@requiere_activo
@limiter.limit("20 per hour")
def crear_o_editar_resena(producto_id):
    usuario_id = int(get_jwt_identity())
    Producto.query.get_or_404(producto_id)
    data = request.get_json(force=True) or {}

    calificacion = data.get("calificacion")
    if not isinstance(calificacion, int) or not (1 <= calificacion <= 5):
        return jsonify({"error": "La calificación debe ser un número entero del 1 al 5"}), 400

    if not _compro_este_producto(usuario_id, producto_id):
        return jsonify({
            "error": "Solo puedes reseñar productos que hayas comprado"
        }), 403

    comentario = (data.get("comentario") or "").strip()[:1000] or None

    resena = Resena.query.filter_by(producto_id=producto_id, usuario_id=usuario_id).first()
    if resena:
        resena.calificacion = calificacion
        resena.comentario = comentario
    else:
        resena = Resena(
            producto_id=producto_id,
            usuario_id=usuario_id,
            calificacion=calificacion,
            comentario=comentario,
            compra_verificada=True,
        )
        db.session.add(resena)

    db.session.commit()
    return jsonify(resena.to_dict()), 201


@bp.delete("/productos/<int:producto_id>/resenas")
@requiere_activo
def eliminar_resena(producto_id):
    usuario_id = int(get_jwt_identity())
    resena = Resena.query.filter_by(producto_id=producto_id, usuario_id=usuario_id).first_or_404()
    db.session.delete(resena)
    db.session.commit()
    return jsonify({"mensaje": "Reseña eliminada"})
