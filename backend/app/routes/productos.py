from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db
from app.models import Producto, Categoria, Resena, DetallePedido, Pedido, VarianteProducto, Talla
from app.utils.decorators import requiere_activo

bp = Blueprint("productos", __name__, url_prefix="/api")


@bp.get("/categorias")
def listar_categorias():
    categorias = Categoria.query.filter_by(activo=True).all()
    return jsonify([c.to_dict() for c in categorias])


@bp.get("/productos")
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

    tallas_param = request.args.get("tallas")
    if tallas_param:
        tallas_pedidas = [t.strip() for t in tallas_param.split(",") if t.strip()]
        if tallas_pedidas:
            # Antes: Producto.tallas.ilike('%"talla"%') sobre una columna de
            # texto/JSON redundante. Ahora se busca contra las variantes
            # reales, uniendo por el catálogo de tallas (case-insensitive).
            query = (
                query.join(VarianteProducto, VarianteProducto.producto_id == Producto.id)
                .join(Talla, Talla.id == VarianteProducto.talla_id)
                .filter(db.func.lower(Talla.nombre).in_([t.lower() for t in tallas_pedidas]))
                .distinct()
            )

    busqueda = (request.args.get("q") or "")[:100] or None
    if busqueda:
        query = query.filter(Producto.nombre.ilike(f"%{busqueda}%"))

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
def listar_resenas(producto_id):
    producto = Producto.query.get_or_404(producto_id)
    resenas = sorted(producto.resenas, key=lambda r: r.fecha_creacion, reverse=True)
    return jsonify({
        "resenas": [r.to_dict() for r in resenas],
        "promedio": producto.promedio_calificacion,
        "total": producto.total_resenas,
    })


@bp.post("/productos/<int:producto_id>/resenas")
@requiere_activo
def crear_o_editar_resena(producto_id):
    usuario_id = int(get_jwt_identity())
    producto = Producto.query.get_or_404(producto_id)
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
