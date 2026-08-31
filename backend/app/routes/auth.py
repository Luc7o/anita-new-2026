from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from app.extensions import db, limiter
from app.models import Usuario, TokenRecuperacion, UbigeoDistrito
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
    respuesta = jsonify({"token": token, "usuario": usuario.to_dict()})
    set_refresh_cookies(respuesta, refresh_token)
    return respuesta, 201


@bp.post("/invitado")
@limiter.limit("10 per hour")
def continuar_como_invitado():
    """
    Checkout como invitado (sprint 1, tarea 4): crea una cuenta SIN
    contraseña para poder comprar sin pasar por el formulario de registro
    completo. Le damos sesión (JWT) igual que en un login/registro normal,
    así el resto del sitio — carrito, checkout — no necesita saber que es
    una cuenta de invitado, funciona exactamente igual.

    Le queda pendiente ponerle contraseña si quiere volver a entrar
    después; eso se ofrece recién en la confirmación del pedido (ver
    /auth/completar-cuenta más abajo), nunca se exige antes de comprar.
    """
    data = request.get_json(force=True) or {}
    campos_requeridos = ["nombre", "apellido", "email"]
    faltantes = [c for c in campos_requeridos if not data.get(c)]
    if faltantes:
        return jsonify({"error": f"Faltan campos: {', '.join(faltantes)}"}), 400

    email = data["email"].lower().strip()[:120]
    if Usuario.query.filter_by(email=email).first():
        # No decimos si esa cuenta ya tiene contraseña o sigue siendo de
        # invitado — en cualquier caso ya existe, así que la salida es la
        # misma: que inicie sesión (o recupere su contraseña si nunca le
        # puso una, desde "¿Olvidaste tu contraseña?").
        return jsonify({
            "error": "Ese correo ya tiene una cuenta. Inicia sesión para continuar con tu compra."
        }), 409

    usuario = Usuario(
        nombre=data["nombre"].strip()[:80],
        apellido=data["apellido"].strip()[:80],
        email=email,
        telefono=(data.get("telefono") or "").strip()[:20] or None,
        password_hash=None,
        es_invitado=True,
    )
    db.session.add(usuario)
    db.session.commit()

    token = create_access_token(identity=str(usuario.id))
    refresh_token = create_refresh_token(identity=str(usuario.id))
    respuesta = jsonify({"token": token, "usuario": usuario.to_dict()})
    set_refresh_cookies(respuesta, refresh_token)
    return respuesta, 201


@bp.post("/completar-cuenta")
@requiere_activo
def completar_cuenta():
    """
    Convierte una cuenta de invitado (creada en /auth/invitado, sin
    contraseña) en una cuenta completa, poniéndole una contraseña para que
    la persona pueda volver a entrar más adelante y ver su historial. Se
    ofrece en la pantalla de confirmación del pedido — si no la usa, la
    cuenta sigue existiendo igual (con su pedido a salvo), solo que no va a
    poder loguearse de nuevo sin pasar por "olvidé mi contraseña".
    """
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    if not usuario.es_invitado:
        return jsonify({"error": "Esta cuenta ya tiene contraseña"}), 400

    data = request.get_json(force=True) or {}
    password = data.get("password") or ""
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    usuario.set_password(password)
    usuario.es_invitado = False
    db.session.commit()
    return jsonify(usuario.to_dict())


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
    respuesta = jsonify({"token": token, "usuario": usuario.to_dict()})
    set_refresh_cookies(respuesta, refresh_token)
    return respuesta


@bp.post("/refrescar-token")
@jwt_required(refresh=True)
def refrescar_token():
    """
    El frontend llama a este endpoint cuando el access_token (que dura 1
    hora) expira, para obtener uno nuevo sin pedirle al usuario que vuelva a
    loguearse. El refresh token (30 días) ya no viaja en el body ni en el
    header: va en una cookie httpOnly que el navegador adjunta solo, y que
    JavaScript no puede leer ni robar vía XSS. Por ser cookie, el request
    también debe traer el header X-CSRF-Token con el valor de la cookie
    legible "csrf_refresh_token" (patrón CSRF de doble envío).
    """
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(int(usuario_id))
    if not usuario or not usuario.activo:
        return jsonify({"error": "Cuenta no disponible"}), 403

    token = create_access_token(identity=usuario_id)
    return jsonify({"token": token})


@bp.post("/logout")
def logout():
    """Limpia la cookie de refresh token. No requiere sesión válida: si ya
    expiró o no existe, igual queremos que el navegador quede sin la cookie."""
    respuesta = jsonify({"mensaje": "Sesión cerrada"})
    unset_jwt_cookies(respuesta)
    return respuesta


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
        "referencia": 200,
    }
    for campo, maximo in limites.items():
        if campo in data:
            valor = data[campo]
            setattr(usuario, campo, (valor or "").strip()[:maximo] or None)

    # La ubicación ahora se elige de las tablas normalizadas (departamento
    # -> provincia -> distrito, ver GET /api/ubicaciones/*) y se guarda
    # como una sola referencia: distrito_id.
    if "distrito_id" in data:
        distrito_id = data["distrito_id"]
        if distrito_id in (None, ""):
            usuario.distrito_id = None
        else:
            distrito = UbigeoDistrito.query.get(distrito_id)
            if not distrito:
                return jsonify({"error": "Distrito no válido"}), 400
            usuario.distrito_id = distrito.id

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
