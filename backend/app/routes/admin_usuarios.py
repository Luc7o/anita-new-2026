from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Usuario, Rol
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_GESTIONAR_USUARIOS, ROLES

bp = Blueprint("admin_usuarios", __name__, url_prefix="/api/admin/usuarios")


@bp.get("/roles")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def listar_roles():
    return jsonify(ROLES)


@bp.get("")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def listar():
    rol = request.args.get("rol")
    query = Usuario.query
    if rol:
        # `rol` ahora es una FK (rol_id -> roles.id), se filtra por el
        # código del rol vía join en vez de comparar texto directo.
        query = query.join(Rol, Usuario.rol_id == Rol.id).filter(Rol.codigo == rol)
    usuarios = query.order_by(Usuario.fecha_registro.desc()).all()
    return jsonify([u.to_dict() for u in usuarios])


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def crear_usuario_admin():
    """Crea un nuevo usuario del staff directamente con un rol administrativo."""
    data = request.get_json(force=True) or {}

    campos_requeridos = ["nombre", "apellido", "email", "password", "rol"]
    faltantes = [c for c in campos_requeridos if not data.get(c)]
    if faltantes:
        return jsonify({"error": f"Faltan campos: {', '.join(faltantes)}"}), 400

    if data["rol"] not in ROLES:
        return jsonify({"error": "Rol no válido"}), 400

    email = data["email"].lower().strip()
    if Usuario.query.filter_by(email=email).first():
        return jsonify({"error": "Ese email ya está registrado"}), 409

    usuario = Usuario(
        nombre=data["nombre"].strip(),
        apellido=data["apellido"].strip(),
        email=email,
        rol=data["rol"],
        es_admin=data["rol"] != "cliente",
    )
    usuario.set_password(data["password"])
    db.session.add(usuario)
    db.session.commit()
    return jsonify(usuario.to_dict()), 201


@bp.put("/<int:usuario_id>/rol")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def cambiar_rol(usuario_id):
    usuario = Usuario.query.get_or_404(usuario_id)
    data = request.get_json(force=True) or {}
    nuevo_rol = data.get("rol")

    if nuevo_rol not in ROLES:
        return jsonify({"error": "Rol no válido"}), 400

    usuario.rol = nuevo_rol
    usuario.es_admin = nuevo_rol != "cliente"
    db.session.commit()
    return jsonify(usuario.to_dict())


@bp.put("/<int:usuario_id>/estado")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def cambiar_estado(usuario_id):
    """Activa/desactiva una cuenta (ej. para revocar acceso de un miembro del staff)."""
    usuario = Usuario.query.get_or_404(usuario_id)
    data = request.get_json(force=True) or {}
    usuario.activo = bool(data.get("activo", True))
    db.session.commit()
    return jsonify(usuario.to_dict())
