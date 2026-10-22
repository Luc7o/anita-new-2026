from functools import wraps
from flask import jsonify, g, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import Usuario


def requiere_roles(*roles_permitidos):
    """Exige un JWT válido, que la cuenta siga ACTIVA, y que tenga uno de los roles indicados.

    Una cuenta desactivada pierde acceso de inmediato aunque su JWT siga
    vigente, porque este chequeo se hace contra la base de datos en cada
    request (no solo contra lo que dice el token).

    De paso deja el usuario autenticado en `flask.g.usuario`, para que la
    función de la ruta pueda hacer una validación de rol más fina cuando el
    permiso general del decorador no alcanza a distinguir (por ejemplo: un
    endpoint donde varios roles pueden cambiar el estado del pedido, pero
    solo uno de ellos puede cancelarlo).

    Si no se indica ningún rol, solo exige sesión válida y cuenta activa.
    """
    def decorador(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return "", 200
            verify_jwt_in_request()
            usuario = Usuario.query.get(int(get_jwt_identity()))
            if not usuario or not usuario.activo:
                return jsonify({"error": "Tu cuenta está desactivada"}), 403
            if roles_permitidos and usuario.rol not in roles_permitidos:
                return jsonify({"error": "No tienes permisos para realizar esta acción"}), 403
            g.usuario = usuario
            return fn(*args, **kwargs)
        return wrapper
    return decorador


# Cualquier usuario con sesión válida y cuenta activa (sin restringir por rol)
requiere_activo = requiere_roles()
