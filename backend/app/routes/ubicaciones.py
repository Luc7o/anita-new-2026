from flask import Blueprint, request, jsonify
from app.utils.cache import cache_publico
from app.utils.zona_entrega import departamento_entrega, provincia_entrega, distritos_entrega

bp = Blueprint("ubicaciones", __name__, url_prefix="/api/ubicaciones")

# Catálogo público de solo lectura (departamento -> provincia -> distrito),
# usado por los formularios de dirección (perfil y checkout) para armar los
# selects en cascada. Solo expone la zona donde hay delivery (Junín >
# Huancayo): ver app/utils/zona_entrega.py. Los demás departamentos siguen en
# la base de datos (los pedidos y reportes antiguos los referencian) pero ya
# no se ofrecen para elegir.


@bp.get("/departamentos")
@cache_publico(ttl=86400, navegador=3600, swr=86400)
def listar_departamentos():
    dep = departamento_entrega()
    return jsonify([dep.to_dict()] if dep else [])


@bp.get("/provincias")
@cache_publico(ttl=86400, navegador=3600, swr=86400)
def listar_provincias():
    departamento_id = request.args.get("departamento_id", type=int)
    if not departamento_id:
        return jsonify({"error": "Falta departamento_id"}), 400
    dep = departamento_entrega()
    prov = provincia_entrega()
    if not dep or not prov or dep.id != departamento_id:
        return jsonify([])
    return jsonify([prov.to_dict()])


@bp.get("/distritos")
@cache_publico(ttl=86400, navegador=3600, swr=86400)
def listar_distritos():
    provincia_id = request.args.get("provincia_id", type=int)
    if not provincia_id:
        return jsonify({"error": "Falta provincia_id"}), 400
    prov = provincia_entrega()
    if not prov or prov.id != provincia_id:
        return jsonify([])
    return jsonify([d.to_dict() for d in distritos_entrega()])
