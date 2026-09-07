import re
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Categoria
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_CATEGORIAS, PUEDE_GESTIONAR_CATEGORIAS

bp = Blueprint("admin_categorias", __name__, url_prefix="/api/admin/categorias")


def _slugificar(texto):
    texto = texto.strip().lower()
    texto = re.sub(r"[^a-z0-9\s-]", "", texto)
    texto = re.sub(r"[\s-]+", "-", texto).strip("-")
    return texto


@bp.get("")
@requiere_roles(*PUEDE_VER_CATEGORIAS)
def listar():
    categorias = Categoria.query.order_by(Categoria.nombre).all()
    return jsonify([c.to_dict() for c in categorias])


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_CATEGORIAS)
def crear():
    data = request.get_json(force=True) or {}
    nombre = (data.get("nombre") or "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    slug = _slugificar(nombre)
    if Categoria.query.filter_by(slug=slug).first():
        return jsonify({"error": "Ya existe una categoría con ese nombre"}), 409

    categoria = Categoria(
        nombre=nombre,
        slug=slug,
        descripcion=data.get("descripcion", ""),
        icono=data.get("icono", "bag"),
    )
    db.session.add(categoria)
    db.session.commit()
    return jsonify(categoria.to_dict()), 201


@bp.put("/<int:categoria_id>")
@requiere_roles(*PUEDE_GESTIONAR_CATEGORIAS)
def actualizar(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    data = request.get_json(force=True) or {}

    if "nombre" in data and data["nombre"].strip():
        categoria.nombre = data["nombre"].strip()
        categoria.slug = _slugificar(data["nombre"])
    if "descripcion" in data:
        categoria.descripcion = data["descripcion"]
    if "icono" in data:
        categoria.icono = data["icono"]
    if "activo" in data:
        categoria.activo = bool(data["activo"])

    db.session.commit()
    return jsonify(categoria.to_dict())


@bp.delete("/<int:categoria_id>")
@requiere_roles(*PUEDE_GESTIONAR_CATEGORIAS)
def eliminar(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    if categoria.productos.count() > 0:
        categoria.activo = False
        db.session.commit()
        return jsonify({"mensaje": "La categoría tiene productos; se desactivó en vez de borrarla"})

    db.session.delete(categoria)
    db.session.commit()
    return jsonify({"mensaje": "Categoría eliminada"})