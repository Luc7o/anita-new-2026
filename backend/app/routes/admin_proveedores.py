from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Proveedor
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_PROVEEDORES, PUEDE_GESTIONAR_PROVEEDORES

bp = Blueprint("admin_proveedores", __name__, url_prefix="/api/admin/proveedores")


@bp.get("")
@requiere_roles(*PUEDE_VER_PROVEEDORES)
def listar():
    proveedores = Proveedor.query.order_by(Proveedor.nombre).all()
    return jsonify([p.to_dict() for p in proveedores])


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def crear():
    data = request.get_json(force=True) or {}
    nombre = (data.get("nombre") or "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    proveedor = Proveedor(
        nombre=nombre,
        contacto_nombre=data.get("contacto_nombre"),
        telefono=data.get("telefono"),
        email=data.get("email"),
        direccion=data.get("direccion"),
        ruc=data.get("ruc"),
        notas=data.get("notas"),
    )
    db.session.add(proveedor)
    db.session.commit()
    return jsonify(proveedor.to_dict()), 201


@bp.put("/<int:proveedor_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def actualizar(proveedor_id):
    proveedor = Proveedor.query.get_or_404(proveedor_id)
    data = request.get_json(force=True) or {}

    campos = ["nombre", "contacto_nombre", "telefono", "email", "direccion", "ruc", "notas", "activo"]
    for campo in campos:
        if campo in data:
            setattr(proveedor, campo, data[campo])

    db.session.commit()
    return jsonify(proveedor.to_dict())


@bp.delete("/<int:proveedor_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def eliminar(proveedor_id):
    proveedor = Proveedor.query.get_or_404(proveedor_id)
    proveedor.activo = False
    db.session.commit()
    return jsonify({"mensaje": "Proveedor desactivado"})
