from flask import Blueprint, jsonify
from app.models import Promocion
from app.utils.cache import cache_publico

bp = Blueprint("promociones", __name__, url_prefix="/api/promociones")


@bp.get("/activas")
@cache_publico(ttl=60, navegador=30)
def listar_activas():
    promos = Promocion.query.filter_by(activo=True).order_by(Promocion.orden.asc()).all()
    return jsonify([p.to_dict() for p in promos if p.vigente])
