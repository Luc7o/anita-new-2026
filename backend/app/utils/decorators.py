from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import Usuario
from app.roles import ROLES_ADMIN


def requiere_roles(*roles_permitidos):
    def decorador(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return "", 200

            verify_jwt_in_request()
            usuario = Usuario.query.get(int(get_jwt_identity()))
            if not usuario or not usuario.activo:
                return jsonify({"error": "Tu cuenta está desactivada"}), 403
            if usuario.rol not in roles_permitidos:
                return jsonify({"error": "No tienes permisos para realizar esta acción"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorador


def admin_required(fn):
    return requiere_roles(*ROLES_ADMIN)(fn)


def requiere_activo(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200

        verify_jwt_in_request()
        usuario = Usuario.query.get(int(get_jwt_identity()))
        if not usuario or not usuario.activo:
            return jsonify({"error": "Tu cuenta está desactivada"}), 403
        return fn(*args, **kwargs)

    return wrapper