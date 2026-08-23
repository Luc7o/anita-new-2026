from datetime import datetime
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Promocion
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_PROMOCIONES, PUEDE_GESTIONAR_PROMOCIONES

bp = Blueprint("admin_promociones", __name__, url_prefix="/api/admin/promociones")


def _parsear_fecha(valor):
    if not valor:
        return None
    try:
        return datetime.strptime(valor, "%Y-%m-%d").date()
    except ValueError:
        return None


@bp.get("")
@requiere_roles(*PUEDE_VER_PROMOCIONES)
def listar():
    promos = Promocion.query.order_by(Promocion.orden.asc(), Promocion.id.desc()).all()
    return jsonify([p.to_dict() for p in promos])


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_PROMOCIONES)
def crear():
    data = request.get_json(force=True) or {}
    titulo = (data.get("titulo") or "").strip()
    if not titulo:
        return jsonify({"error": "El título es obligatorio"}), 400

    promocion = Promocion(
        etiqueta=(data.get("etiqueta") or "").strip()[:60],
        titulo=titulo[:150],
        descripcion=(data.get("descripcion") or "").strip()[:400],
        imagen_url=data.get("imagen_url") or "",
        boton_texto=(data.get("boton_texto") or "Ver Todo").strip()[:60],
        boton_link=(data.get("boton_link") or "/tienda").strip()[:200],
        fecha_inicio=_parsear_fecha(data.get("fecha_inicio")),
        fecha_fin=_parsear_fecha(data.get("fecha_fin")),
        activo=bool(data.get("activo", True)),
        orden=int(data.get("orden") or 0),
    )
    db.session.add(promocion)
    db.session.commit()
    return jsonify(promocion.to_dict()), 201


@bp.put("/<int:promocion_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROMOCIONES)
def actualizar(promocion_id):
    promocion = Promocion.query.get_or_404(promocion_id)
    data = request.get_json(force=True) or {}

    if "titulo" in data and data["titulo"].strip():
        promocion.titulo = data["titulo"].strip()[:150]
    if "etiqueta" in data:
        promocion.etiqueta = (data["etiqueta"] or "").strip()[:60]
    if "descripcion" in data:
        promocion.descripcion = (data["descripcion"] or "").strip()[:400]
    if "imagen_url" in data:
        promocion.imagen_url = data["imagen_url"] or ""
    if "boton_texto" in data:
        promocion.boton_texto = (data["boton_texto"] or "Ver Todo").strip()[:60]
    if "boton_link" in data:
        promocion.boton_link = (data["boton_link"] or "/tienda").strip()[:200]
    if "fecha_inicio" in data:
        promocion.fecha_inicio = _parsear_fecha(data["fecha_inicio"])
    if "fecha_fin" in data:
        promocion.fecha_fin = _parsear_fecha(data["fecha_fin"])
    if "activo" in data:
        promocion.activo = bool(data["activo"])
    if "orden" in data:
        promocion.orden = int(data["orden"] or 0)

    db.session.commit()
    return jsonify(promocion.to_dict())


@bp.delete("/<int:promocion_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROMOCIONES)
def eliminar(promocion_id):
    promocion = Promocion.query.get_or_404(promocion_id)
    db.session.delete(promocion)
    db.session.commit()
    return jsonify({"mensaje": "Promoción eliminada"})
