from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Usuario
from app.roles import ROLES_ADMIN


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
    """

    def decorador(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            usuario = Usuario.query.get(int(get_jwt_identity()))
            if not usuario or not usuario.activo:
                return jsonify({"error": "Tu cuenta está desactivada"}), 403
            if usuario.rol not in roles_permitidos:
                return jsonify({"error": "No tienes permisos para realizar esta acción"}), 403
            g.usuario = usuario
            return fn(*args, **kwargs)

        return wrapper

    return decorador


def admin_required(fn):
    """Cualquier rol con acceso al panel admin (chequeo general de entrada)."""
    return requiere_roles(*ROLES_ADMIN)(fn)


def requiere_activo(fn):
    """
    Para rutas de CLIENTES (no admin): exige JWT válido y que la cuenta siga
    activa. Se usa en vez de @jwt_required() suelto en cualquier endpoint que
    permita a un cliente leer o modificar datos (perfil, carrito, pedidos,
    reseñas), para que desactivar una cuenta la deje sin acceso de verdad.
    """

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        usuario = Usuario.query.get(int(get_jwt_identity()))
        if not usuario or not usuario.activo:
            return jsonify({"error": "Tu cuenta está desactivada"}), 403
        g.usuario = usuario
        return fn(*args, **kwargs)

    return wrapper