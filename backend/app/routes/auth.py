from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from app.extensions import db, limiter
from app.models import Usuario, TokenRecuperacion
from app.utils.decorators import requiere_activo
from app.utils.correo import enviar_correo

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/registro")
@limiter.limit("10 per hour")
def registro():
    data = request.get_json(force=True) or {}
    campos_requeridos = ["nombre", "apellido", "email", "password"]
    faltantes = [c for c in campos_requeridos if not data.get(c)]
    if faltantes:
        return jsonify({"error": f"Faltan campos: {', '.join(faltantes)}"}), 400

    if len(data["password"]) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    if Usuario.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"error": "Ese email ya está registrado"}), 409

    tipo_documento = (data.get("tipo_documento") or "").lower().strip() or None
    numero_documento = (data.get("numero_documento") or "").strip() or None

    if tipo_documento and tipo_documento not in Usuario.TIPOS_DOCUMENTO:
        return jsonify({"error": "Tipo de documento inválido"}), 400
    if numero_documento and not tipo_documento:
        return jsonify({"error": "Indica el tipo de documento"}), 400
    if numero_documento:
        if Usuario.query.filter_by(numero_documento=numero_documento).first():
            return jsonify({"error": "Ese número de documento ya está registrado"}), 409

    usuario = Usuario(
        nombre=data["nombre"].strip()[:80],
        apellido=data["apellido"].strip()[:80],
        email=data["email"].lower().strip()[:120],
        telefono=(data.get("telefono") or "").strip()[:20] or None,
        tipo_documento=tipo_documento,
        numero_documento=numero_documento,
    )
    usuario.set_password(data["password"])
    db.session.add(usuario)
    db.session.commit()

    enviar_correo(
        destinatario=usuario.email,
        asunto="¡Bienvenida a Anita New Style!",
        texto=(
            f"Hola {usuario.nombre},\n\n"
            f"Gracias por registrarte en Anita New Style. Tu cuenta ya está lista "
            f"y puedes empezar a comprar cuando quieras.\n\n"
            f"Si no creaste esta cuenta, puedes ignorar este correo."
        ),
    )

    token = create_access_token(identity=str(usuario.id))
    refresh_token = create_refresh_token(identity=str(usuario.id))
    return jsonify({"token": token, "refresh_token": refresh_token, "usuario": usuario.to_dict()}), 201


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario or not usuario.check_password(password):
        return jsonify({"error": "Email o contraseña incorrectos"}), 401
    if not usuario.activo:
        return jsonify({"error": "Cuenta desactivada"}), 403

    token = create_access_token(identity=str(usuario.id))
    refresh_token = create_refresh_token(identity=str(usuario.id))
    return jsonify({"token": token, "refresh_token": refresh_token, "usuario": usuario.to_dict()})


@bp.post("/refrescar-token")
@jwt_required(refresh=True)
def refrescar_token():
    """
    El frontend llama a este endpoint con el refresh_token (que dura 30
    días) cuando el access_token (que dura 1 hora) expira, para obtener uno
    nuevo sin pedirle al usuario que vuelva a loguearse.
    """
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    if not usuario or not usuario.activo:
        return jsonify({"error": "Cuenta no disponible"}), 403

    token = create_access_token(identity=usuario_id)
    return jsonify({"token": token})


@bp.get("/perfil")
@requiere_activo
def perfil():
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    return jsonify(usuario.to_dict(incluir_direccion=True))


@bp.put("/perfil")
@requiere_activo
def actualizar_perfil():
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True) or {}

    limites = {
        "nombre": 80, "apellido": 80, "telefono": 20, "direccion": 200,
        "distrito": 100, "provincia": 100, "departamento": 100, "referencia": 200,
    }
    for campo, maximo in limites.items():
        if campo in data:
            valor = data[campo]
            setattr(usuario, campo, (valor or "").strip()[:maximo] or None)

    db.session.commit()
    return jsonify(usuario.to_dict(incluir_direccion=True))


@bp.put("/cambiar-password")
@requiere_activo
def cambiar_password():
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True) or {}

    password_actual = data.get("password_actual", "")
    password_nueva = data.get("password_nueva", "")

    if not usuario.check_password(password_actual):
        return jsonify({"error": "Tu contraseña actual no es correcta"}), 400
    if len(password_nueva) < 6:
        return jsonify({"error": "La nueva contraseña debe tener al menos 6 caracteres"}), 400

    usuario.set_password(password_nueva)
    # Cualquier link de recuperación pendiente queda invalidado al cambiar la
    # contraseña por esta vía (ya no tiene sentido que siga sirviendo).
    TokenRecuperacion.query.filter_by(usuario_id=usuario.id, usado=False).update({"usado": True})
    db.session.commit()
    return jsonify({"mensaje": "Contraseña actualizada correctamente"})


@bp.post("/olvide-password")
@limiter.limit("5 per hour")
def olvide_password():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").lower().strip()
    usuario = Usuario.query.filter_by(email=email).first()

    # Respuesta genérica siempre, para no revelar si el correo existe o no,
    # ni si la cuenta está activa o desactivada.
    respuesta = {"mensaje": "Si el correo existe, te enviaremos instrucciones para recuperar tu cuenta."}

    if usuario and usuario.activo:
        registro_token = TokenRecuperacion.generar(usuario.id)
        db.session.commit()

        link = f"{current_app.config['FRONTEND_ORIGIN']}/restablecer-password?token={registro_token.token}"

        enviar_correo(
            destinatario=usuario.email,
            asunto="Recupera tu contraseña — Anita New Style",
            texto=(
                f"Hola {usuario.nombre},\n\n"
                f"Para restablecer tu contraseña entra a este enlace "
                f"(válido por 30 minutos y de un solo uso):\n{link}\n\n"
                f"Si no pediste esto, ignora este correo."
            ),
        )

    return jsonify(respuesta)


@bp.post("/restablecer-password")
@limiter.limit("10 per hour")
def restablecer_password():
    data = request.get_json(force=True) or {}
    token = data.get("token", "")
    password_nueva = data.get("password_nueva", "")

    if len(password_nueva) < 6:
        return jsonify({"error": "La nueva contraseña debe tener al menos 6 caracteres"}), 400

    registro_token = TokenRecuperacion.query.filter_by(token=token).first()
    if not registro_token or not registro_token.vigente:
        return jsonify({"error": "El enlace de recuperación es inválido, ya expiró o ya fue usado"}), 400

    usuario = Usuario.query.get(registro_token.usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404
    if not usuario.activo:
        return jsonify({"error": "Esta cuenta está desactivada"}), 403

    usuario.set_password(password_nueva)
    registro_token.usado = True  # de un solo uso: no se puede volver a usar este link
    db.session.commit()
    return jsonify({"mensaje": "Contraseña restablecida correctamente, ya puedes ingresar"})
