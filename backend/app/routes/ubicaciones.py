from flask import Blueprint, request, jsonify
from app.models import UbigeoDepartamento, UbigeoProvincia, UbigeoDistrito

bp = Blueprint("ubicaciones", __name__, url_prefix="/api/ubicaciones")

# Catálogo público de solo lectura (departamento -> provincia -> distrito),
# usado por el formulario de dirección (registro, perfil, checkout) para
# armar los 3 selects en cascada. No requiere sesión: es información
# pública igual que cualquier lista de ciudades de un formulario.


@bp.get("/departamentos")
def listar_departamentos():
    departamentos = UbigeoDepartamento.query.order_by(UbigeoDepartamento.nombre).all()
    return jsonify([d.to_dict() for d in departamentos])


@bp.get("/provincias")
def listar_provincias():
    departamento_id = request.args.get("departamento_id", type=int)
    if not departamento_id:
        return jsonify({"error": "Falta departamento_id"}), 400
    provincias = (
        UbigeoProvincia.query
        .filter_by(departamento_id=departamento_id)
        .order_by(UbigeoProvincia.nombre)
        .all()
    )
    return jsonify([p.to_dict() for p in provincias])


@bp.get("/distritos")
def listar_distritos():
    provincia_id = request.args.get("provincia_id", type=int)
    if not provincia_id:
        return jsonify({"error": "Falta provincia_id"}), 400
    distritos = (
        UbigeoDistrito.query
        .filter_by(provincia_id=provincia_id)
        .order_by(UbigeoDistrito.nombre)
        .all()
    )
    return jsonify([d.to_dict() for d in distritos])
