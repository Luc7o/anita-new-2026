from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm import joinedload, selectinload
from app.extensions import db
from app.models import Favorito, Producto
from app.utils.decorators import requiere_activo

bp = Blueprint("favoritos", __name__, url_prefix="/api/favoritos")


@bp.get("")
@requiere_activo
def listar():
    usuario_id = int(get_jwt_identity())
    favoritos = (
        Favorito.query.filter_by(usuario_id=usuario_id)
        .options(
            joinedload(Favorito.producto).joinedload(Producto.categoria),
            joinedload(Favorito.producto).selectinload(Producto.imagenes),
            joinedload(Favorito.producto).selectinload(Producto.resenas),
        )
        .order_by(Favorito.fecha_creacion.desc())
        .all()
    )
    # Un producto puede haber sido desactivado/borrado después de marcarse
    # como favorito — se filtra en vez de romper la lista del cliente.
    productos = [f.producto.to_dict(resumen=True) for f in favoritos if f.producto and f.producto.activo]
    return jsonify(productos)


@bp.get("/ids")
@requiere_activo
def listar_ids():
    """IDs de productos favoritos del usuario — liviano, para marcar el
    corazón en las tarjetas de producto sin traer toda la info."""
    usuario_id = int(get_jwt_identity())
    ids = [f.producto_id for f in Favorito.query.filter_by(usuario_id=usuario_id).all()]
    return jsonify(ids)


@bp.post("/<int:producto_id>")
@requiere_activo
def agregar(producto_id):
    usuario_id = int(get_jwt_identity())
    Producto.query.get_or_404(producto_id)

    existente = Favorito.query.filter_by(usuario_id=usuario_id, producto_id=producto_id).first()
    if not existente:
        db.session.add(Favorito(usuario_id=usuario_id, producto_id=producto_id))
        db.session.commit()
    return jsonify({"favorito": True}), 201


@bp.delete("/<int:producto_id>")
@requiere_activo
def quitar(producto_id):
    usuario_id = int(get_jwt_identity())
    favorito = Favorito.query.filter_by(usuario_id=usuario_id, producto_id=producto_id).first()
    if favorito:
        db.session.delete(favorito)
        db.session.commit()
    return jsonify({"favorito": False})
