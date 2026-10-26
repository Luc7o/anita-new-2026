import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from email_validator import validate_email, EmailNotValidError
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_csrf_token,
    get_jwt_identity,
)
from app.extensions import db, limiter
from app.models import Usuario, TokenRecuperacion, UbigeoDistrito
from app.utils.decorators import requiere_activo
from app.utils.correo import enviar_correo
from app.utils.google_auth import verificar_token_google, TokenGoogleInvalido
from app.utils import totp

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# --- Cookies separadas: tienda y panel admin ---------------------------------
# El frontend manda "X-Panel: admin" desde el panel. Cada panel usa SUS
# propias cookies (refresh + csrf + dispositivo 2FA), así se puede tener una
# cuenta en la tienda y otra distinta en el admin en el mismo navegador.
def _es_admin():
    return request.headers.get("X-Panel") == "admin"


def _nombres_cookies():
    if _es_admin():
        return "ans_admin_refresh_token", "csrf_admin_refresh_token", "ans_admin_dispositivo_2fa"
    return "ans_refresh_token", "csrf_refresh_token", COOKIE_DISPOSITIVO


def _poner_cookies_refresh(respuesta, refresh_token):
    nombre, nombre_csrf, _ = _nombres_cookies()
    cfg = current_app.config
    comunes = dict(
        max_age=int(cfg["JWT_REFRESH_TOKEN_EXPIRES"].total_seconds()),
        secure=cfg.get("JWT_COOKIE_SECURE", False),
        samesite=cfg.get("JWT_COOKIE_SAMESITE", "Lax"),
        domain=cfg.get("JWT_COOKIE_DOMAIN"),
    )
    respuesta.set_cookie(nombre, refresh_token, httponly=True, path=cfg["JWT_REFRESH_COOKIE_PATH"], **comunes)
    respuesta.set_cookie(nombre_csrf, get_csrf_token(refresh_token), httponly=False, path="/", **comunes)


def _borrar_cookies_refresh(respuesta):
    nombre, nombre_csrf, _ = _nombres_cookies()
    cfg = current_app.config
    dominio = cfg.get("JWT_COOKIE_DOMAIN")
    respuesta.delete_cookie(nombre, path=cfg["JWT_REFRESH_COOKIE_PATH"], domain=dominio)
    respuesta.delete_cookie(nombre_csrf, path="/", domain=dominio)


def _usuario_desde_refresh(obligatorio=True):
    """Lee el refresh token de la cookie del panel actual, valida CSRF,
    tipo y sesion_version. Devuelve el Usuario o None (si no es obligatorio)."""
    nombre, _, _ = _nombres_cookies()
    token = request.cookies.get(nombre)
    try:
        if not token:
            raise ValueError("sin cookie")
        datos = decode_token(token)
        csrf = request.headers.get("X-CSRF-Token", "")
        if datos.get("type") != "refresh" or not hmac.compare_digest(str(datos.get("csrf", "")), csrf):
            raise ValueError("refresh inválido")
        usuario = Usuario.query.get(int(datos["sub"]))
        if not usuario or datos.get("sv") != usuario.sesion_version:
            raise ValueError("sesión revocada")
        return usuario
    except Exception:
        if obligatorio:
            return None
        return None


def _crear_par_tokens(usuario):
    """Access + refresh token, ambos con el sesion_version ACTUAL del
    usuario grabado en el claim "sv" (ver el blocklist loader en
    app/__init__.py). Centralizado acá para que login/registro/invitado/
    refresh/cambiar-password siempre lo hagan de la misma forma."""
    claims = {"sv": usuario.sesion_version}
    access_token = create_access_token(identity=str(usuario.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(usuario.id), additional_claims=claims)
    return access_token, refresh_token


# ---- Segundo paso del login (verificación en dos pasos) -------------------
# Si la cuenta tiene 2FA, el login con contraseña (o con Google) NO entrega
# sesión: devuelve un "pase" firmado y de corta duración que solo sirve para
# /auth/login-2fa. No es un JWT, así que ningún otro endpoint lo acepta.
SEGUNDOS_VALIDEZ_PASE_2FA = 5 * 60


def _serializador_2fa():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="login-2fa")


# ---- Dispositivo de confianza ----------------------------------------------
# Si la persona marca "confiar en este dispositivo" al pasar el segundo paso, el
# navegador recibe una cookie httpOnly firmada. Mientras sea válida, ese
# navegador se salta el código de 6 dígitos (la contraseña SIEMPRE se sigue
# pidiendo). La cookie guarda al usuario y una "huella" de su contraseña y de su
# secreto 2FA: si cambia la contraseña o se desactiva/reactiva la verificación en
# dos pasos, deja de valer. No usa sesion_version a propósito, porque cerrar
# sesión lo sube y la gracia es que no te vuelva a pedir el código por salir.
DIAS_DISPOSITIVO_CONFIABLE = 30
COOKIE_DISPOSITIVO = "ans_dispositivo_2fa"


def _serializador_dispositivo():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="dispositivo-2fa")


def _huella_dispositivo(usuario):
    clave = current_app.config["SECRET_KEY"].encode()
    mensaje = f"{usuario.password_hash or ''}|{usuario.totp_secreto or ''}".encode()
    return hmac.new(clave, mensaje, hashlib.sha256).hexdigest()[:32]


def _dispositivo_confiable(usuario):
    token = request.cookies.get(_nombres_cookies()[2])
    if not token:
        return False
    try:
        datos = _serializador_dispositivo().loads(token, max_age=DIAS_DISPOSITIVO_CONFIABLE * 86400)
    except BadSignature:  # incluye SignatureExpired
        return False
    return datos.get("uid") == usuario.id and hmac.compare_digest(
        str(datos.get("fp", "")), _huella_dispositivo(usuario)
    )


def _recordar_dispositivo(respuesta, usuario):
    token = _serializador_dispositivo().dumps({"uid": usuario.id, "fp": _huella_dispositivo(usuario)})
    respuesta.set_cookie(
        _nombres_cookies()[2],
        token,
        max_age=DIAS_DISPOSITIVO_CONFIABLE * 86400,
        httponly=True,
        secure=current_app.config.get("JWT_COOKIE_SECURE", False),
        samesite=current_app.config.get("JWT_COOKIE_SAMESITE", "Lax"),
        path="/api/auth",
        domain=current_app.config.get("JWT_COOKIE_DOMAIN"),
    )


def _respuesta_pide_segundo_paso(usuario):
    # Navegador ya verificado antes (y la contraseña/Google ya se comprobó arriba):
    # entra directo, sin pedir el código.
    if _dispositivo_confiable(usuario):
        usuario.resetear_intentos_fallidos()
        db.session.commit()
        return _respuesta_con_sesion(usuario)
    pase = _serializador_2fa().dumps({"uid": usuario.id, "sv": usuario.sesion_version})
    return jsonify({"requiere_2fa": True, "token_2fa": pase})


def _respuesta_con_sesion(usuario, codigo_estado=200, extra=None, con_usuario=True):
    """Arma la respuesta con sesión nueva (token + csrf + cookie de refresh)."""
    token, refresh_token = _crear_par_tokens(usuario)
    cuerpo = {"token": token, "csrf": get_csrf_token(refresh_token)}
    if con_usuario:
        cuerpo["usuario"] = usuario.to_dict()
    if extra:
        cuerpo.update(extra)
    respuesta = jsonify(cuerpo)
    _poner_cookies_refresh(respuesta, refresh_token)
    return respuesta, codigo_estado


def _verificar_segundo_factor(usuario, codigo):
    """Valida un código de la app (6 dígitos) o uno de respaldo. Si es válido
    lo deja registrado (paso usado / código de respaldo gastado) y devuelve
    (True, usó_respaldo); si no, (False, False). No hace commit."""
    secreto = totp.descifrar(usuario.totp_secreto) if usuario.totp_secreto else None
    if secreto:
        paso = totp.verificar_codigo(secreto, codigo, usuario.totp_ultimo_paso)
        if paso is not None:
            usuario.totp_ultimo_paso = paso
            return True, False
    restantes = totp.consumir_codigo_respaldo(usuario.codigos_respaldo, codigo)
    if restantes is not None:
        usuario.codigos_respaldo = restantes
        return True, True
    return False, False


# Cuánto dura el enlace para crear la contraseña de una cuenta nueva. Más
# largo que el de "olvidé mi contraseña" (30 min): quien compró como invitado
# puede abrir el correo horas o días después, y el enlace sigue siendo de un
# solo uso.
MINUTOS_VALIDEZ_CREAR_PASSWORD = 60 * 24 * 3
# Mínimo entre dos correos de enlace al mismo usuario: evita que alguien use
# los formularios públicos para llenarle el buzón a un tercero.
SEGUNDOS_ENTRE_CORREOS = 60


def _normalizar_email(valor):
    """Devuelve (email_normalizado, None) o (None, mensaje_de_error)."""
    valor = (valor or "").strip().lower()
    if not valor:
        return None, "Escribe tu correo electrónico"
    if len(valor) > 120:
        return None, "El correo es demasiado largo"
    try:
        validado = validate_email(valor, check_deliverability=False)
    except EmailNotValidError:
        return None, "Escribe un correo electrónico válido"
    return validado.normalized.lower(), None


def _nombre_aleatorio():
    """Nombre provisional para una cuenta creada solo con el correo
    ("Cliente 3FA9"). La persona da sus datos reales al comprar (el
    checkout actualiza el perfil) o los edita después en su perfil."""
    return f"Cliente {secrets.token_hex(2).upper()}"


def _asignar_password_aleatoria(usuario):
    """Contraseña aleatoria que nadie conoce: la cuenta queda con una clave
    válida pero inutilizable. Sirve para que la cuenta nunca esté "vacía";
    la persona elige la suya real con el enlace que recibe por correo."""
    usuario.set_password(secrets.token_urlsafe(32))


def _enviar_correo_crear_password(usuario, cuenta_existente=False):
    """
    Envía el enlace para crear (o recuperar) la contraseña. Reutiliza el
    mismo token de un solo uso del flujo "olvidé mi contraseña": al abrirlo
    la persona cae en /restablecer-password y elige su contraseña.

    Devuelve False si no se envió porque ya se mandó uno hace menos de
    SEGUNDOS_ENTRE_CORREOS (el usuario ya tiene un enlace vigente en su buzón).
    """
    ultimo = (
        TokenRecuperacion.query.filter_by(usuario_id=usuario.id)
        .order_by(TokenRecuperacion.creado_en.desc())
        .first()
    )
    if ultimo and ultimo.creado_en and (
        datetime.utcnow() - ultimo.creado_en
    ) < timedelta(seconds=SEGUNDOS_ENTRE_CORREOS):
        return False

    registro_token = TokenRecuperacion.generar(
        usuario.id, minutos_validez=MINUTOS_VALIDEZ_CREAR_PASSWORD
    )
    db.session.commit()
    link = f"{current_app.config['FRONTEND_TIENDA_URL']}/restablecer-password?token={registro_token.token}"

    if cuenta_existente:
        asunto = "Ya tienes una cuenta — Anita New Style"
        texto = (
            "Hola,\n\n"
            "Alguien intentó registrar este correo en Anita New Style, pero ya tienes una cuenta. "
            "Puedes iniciar sesión normalmente. Si olvidaste tu contraseña, crea una nueva aquí "
            f"(el enlace dura 3 días y es de un solo uso):\n{link}\n\n"
            "Si no fuiste tú, ignora este correo."
        )
    else:
        asunto = "Crea tu contraseña — Anita New Style"
        texto = (
            "Hola,\n\n"
            "Gracias por tu interés en Anita New Style. Ya tienes una cuenta con este correo; "
            "para poder volver a entrar y ver tus pedidos, crea tu contraseña aquí "
            f"(el enlace dura 3 días y es de un solo uso):\n{link}\n\n"
            "Si no fuiste tú, ignora este correo."
        )

    enviar_correo(destinatario=usuario.email, asunto=asunto, texto=texto)
    return True


def _conflicto_cuenta_existente(mensaje):
    return jsonify({"error": mensaje, "code": "cuenta_existente"}), 409


def _crear_cuenta_sin_password(**campos):
    """Crea una cuenta de invitado (contraseña aleatoria), la guarda y le envía el
    enlace para que cree su contraseña real cuando quiera."""
    usuario = Usuario(es_invitado=True, **campos)
    _asignar_password_aleatoria(usuario)
    db.session.add(usuario)
    db.session.commit()
    _enviar_correo_crear_password(usuario)
    return usuario


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

    return _respuesta_con_sesion(usuario, 201)


@bp.post("/invitado")
@limiter.limit("10 per hour")
def continuar_como_invitado():
    """
    Compra como invitado: crea una cuenta SOLO con el correo (sin contraseña,
    sin formulario) y devuelve sesión (JWT) igual que un login normal, así el
    carrito y el checkout funcionan igual. Se usa al pagar, cuando la persona
    ya armó su carrito sin registrarse.

    Le enviamos por correo un enlace para crear su contraseña; así puede
    volver a entrar y ver sus pedidos después. Nunca se exige antes de comprar.
    Nombre y apellido son opcionales (el checkout los pide de todas formas
    para la entrega y luego actualiza el perfil).
    """
    data = request.get_json(force=True) or {}
    email, error = _normalizar_email(data.get("email"))
    if error:
        return jsonify({"error": error}), 400

    if Usuario.query.filter_by(email=email).first():
        # No decimos si esa cuenta ya tiene contraseña o sigue siendo de
        # invitado: en cualquier caso ya existe, y la salida es la misma.
        return _conflicto_cuenta_existente(
            "Ese correo ya tiene una cuenta. Inicia sesión para continuar con tu compra "
            "(si aún no creaste tu contraseña, usa «¿Olvidaste tu contraseña?»)."
        )

    usuario = _crear_cuenta_sin_password(
        nombre=(data.get("nombre") or "").strip()[:80] or _nombre_aleatorio(),
        apellido=(data.get("apellido") or "").strip()[:80],
        email=email,
        telefono=(data.get("telefono") or "").strip()[:20] or None,
    )
    return _respuesta_con_sesion(usuario, 201)


@bp.post("/registro-email")
@limiter.limit("10 per hour")
def registro_con_email():
    """
    Registro rápido solo con el correo, para reducir pasos: se crea la cuenta
    con un nombre y una contraseña ALEATORIOS y se devuelve sesión (JWT) igual
    que un login normal, así la persona puede seguir comprando de inmediato.
    Sus datos reales los da en el checkout (que actualiza el perfil).

    Además se le envía un enlace para elegir su contraseña real cuando quiera
    (también confirma que el correo es suyo). Al usarlo, todas las sesiones
    abiertas antes se cierran (sesion_version), así que si alguien hubiera
    registrado el correo de otra persona, esa persona recupera el control.

    Si el correo YA tiene cuenta NO se da sesión (sería entrar a una cuenta
    ajena): se responde 409 para que inicie sesión.
    """
    data = request.get_json(force=True) or {}
    email, error = _normalizar_email(data.get("email"))
    if error:
        return jsonify({"error": error}), 400

    if Usuario.query.filter_by(email=email).first():
        return _conflicto_cuenta_existente(
            "Ese correo ya tiene una cuenta. Inicia sesión "
            "(si aún no creaste tu contraseña, usa «¿Olvidaste tu contraseña?»)."
        )

    usuario = _crear_cuenta_sin_password(nombre=_nombre_aleatorio(), apellido="", email=email)
    return _respuesta_con_sesion(usuario, 201)


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

    # Bloqueo por cuenta (además del límite por IP de arriba): protege
    # aunque el atacante rote de IP en cada intento, algo que el limiter
    # por IP no puede evitar por sí solo.
    if usuario and usuario.esta_bloqueado:
        minutos_restantes = max(1, int((usuario.bloqueado_hasta - datetime.utcnow()).total_seconds() // 60) + 1)
        return jsonify({
            "error": f"Demasiados intentos fallidos. Intenta de nuevo en {minutos_restantes} minuto(s)."
        }), 429

    if not usuario or not usuario.check_password(password):
        if usuario:
            usuario.registrar_intento_fallido()
            db.session.commit()
        return jsonify({"error": "Email o contraseña incorrectos"}), 401
    if not usuario.activo:
        return jsonify({"error": "Cuenta desactivada"}), 403

    # La contraseña es correcta, pero si tiene verificación en dos pasos todavía
    # falta el segundo factor: los intentos fallidos se limpian recién cuando lo pasa.
    if usuario.totp_activo:
        return _respuesta_pide_segundo_paso(usuario)

    usuario.resetear_intentos_fallidos()
    db.session.commit()

    respuesta, _ = _respuesta_con_sesion(usuario)
    return respuesta


@bp.post("/login-2fa")
@limiter.limit("10 per minute")
def login_2fa():
    """Segundo paso del inicio de sesión: código de la app de autenticación
    (6 dígitos) o un código de respaldo."""
    data = request.get_json(force=True) or {}
    try:
        pase = _serializador_2fa().loads(data.get("token_2fa") or "", max_age=SEGUNDOS_VALIDEZ_PASE_2FA)
    except SignatureExpired:
        return jsonify({"error": "Pasaron más de 5 minutos. Vuelve a iniciar sesión.", "code": "pase_expirado"}), 401
    except BadSignature:
        return jsonify({"error": "Solicitud no válida. Vuelve a iniciar sesión.", "code": "pase_expirado"}), 401

    usuario = Usuario.query.get(pase.get("uid"))
    if not usuario or not usuario.activo or not usuario.totp_activo or usuario.sesion_version != pase.get("sv"):
        return jsonify({"error": "Solicitud no válida. Vuelve a iniciar sesión.", "code": "pase_expirado"}), 401

    if usuario.esta_bloqueado:
        minutos_restantes = max(1, int((usuario.bloqueado_hasta - datetime.utcnow()).total_seconds() // 60) + 1)
        return jsonify({"error": f"Demasiados intentos fallidos. Intenta de nuevo en {minutos_restantes} minuto(s)."}), 429

    valido, uso_respaldo = _verificar_segundo_factor(usuario, data.get("codigo"))
    if not valido:
        usuario.registrar_intento_fallido()
        db.session.commit()
        return jsonify({"error": "El código no es correcto. Revisa tu app de autenticación e inténtalo de nuevo."}), 401

    usuario.resetear_intentos_fallidos()
    db.session.commit()
    extra = None
    if uso_respaldo:
        extra = {"codigos_respaldo_restantes": totp.cantidad_codigos_respaldo(usuario.codigos_respaldo)}
    respuesta, _ = _respuesta_con_sesion(usuario, extra=extra)
    if data.get("recordar_dispositivo") is True:
        _recordar_dispositivo(respuesta, usuario)
    return respuesta


@bp.post("/google")
@limiter.limit("20 per hour")
def login_google():
    """
    Registro / inicio de sesión con Google (Google Identity Services).

    El frontend manda el "credential" (un ID token firmado por Google) que
    recibe del botón de Google. Acá se verifica la firma, que el token sea
    para ESTA app (GOOGLE_CLIENT_ID) y que Google haya verificado el correo.
    Nunca confiamos en el email/nombre que mande el cliente, solo en lo que
    sale del token ya verificado.

    - Si ya existe un usuario con ese google_id -> inicia sesión.
    - Si existe un usuario con ese email (cuenta normal o de invitado) ->
      se vincula a Google y entra. Es seguro porque Google garantiza que la
      persona controla ese correo.
    - Si no existe -> se crea una cuenta nueva sin contraseña (puede
      ponerle una después con "¿Olvidaste tu contraseña?").
    """
    data = request.get_json(force=True) or {}
    credential = (data.get("credential") or "").strip()
    if not credential:
        return jsonify({"error": "Falta el token de Google"}), 400

    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({"error": "El inicio de sesión con Google no está disponible por ahora"}), 503

    try:
        perfil_google = verificar_token_google(credential, client_id)
    except TokenGoogleInvalido as e:
        return jsonify({"error": str(e)}), 401

    google_id = perfil_google["sub"]
    email = perfil_google["email"]

    usuario = Usuario.query.filter_by(google_id=google_id).first()
    if not usuario:
        usuario = Usuario.query.filter_by(email=email).first()
        if usuario:
            if usuario.google_id and usuario.google_id != google_id:
                return jsonify({"error": "Ese correo ya está vinculado a otra cuenta de Google"}), 409
            usuario.google_id = google_id
            # Una cuenta de invitado que entra con Google pasa a ser una
            # cuenta completa (ya tiene una forma de volver a entrar). Si era
            # de invitado, se cierran las sesiones abiertas antes: pudo
            # haberla creado otra persona con el correo de quien entra ahora
            # (Google sí garantiza que este correo es suyo).
            if usuario.es_invitado:
                usuario.sesion_version += 1
            usuario.es_invitado = False

    nueva = usuario is None
    if nueva:
        usuario = Usuario(
            nombre=perfil_google["nombre"][:80],
            apellido=perfil_google["apellido"][:80],
            email=email[:120],
            password_hash=None,
            google_id=google_id,
            es_invitado=False,
            activo=True,
        )
        db.session.add(usuario)

    if not usuario.activo:
        db.session.rollback()
        return jsonify({"error": "Cuenta desactivada"}), 403

    usuario.resetear_intentos_fallidos()
    db.session.commit()

    if nueva:
        enviar_correo(
            destinatario=usuario.email,
            asunto="¡Bienvenida a Anita New Style!",
            texto=(
                f"Hola {usuario.nombre},\n\n"
                f"Gracias por registrarte en Anita New Style con tu cuenta de Google. "
                f"Tu cuenta ya está lista y puedes empezar a comprar cuando quieras.\n\n"
                f"Si no creaste esta cuenta, puedes ignorar este correo."
            ),
        )

    if usuario.totp_activo:
        return _respuesta_pide_segundo_paso(usuario)

    return _respuesta_con_sesion(usuario, 201 if nueva else 200)


@bp.post("/refrescar-token")
@limiter.limit("30 per minute")
def refrescar_token():
    """
    El frontend llama a este endpoint cuando el access_token (que dura 15
    minutos) expira, para obtener uno nuevo sin pedirle al usuario que
    vuelva a loguearse. El refresh token (30 días) ya no viaja en el body
    ni en el header: va en una cookie httpOnly que el navegador adjunta
    solo, y que JavaScript no puede leer ni robar vía XSS. Por ser cookie,
    el request también debe traer el header X-CSRF-Token con el valor de
    la cookie legible "csrf_refresh_token" (patrón CSRF de doble envío).

    Rotación: cada vez que se usa el refresh token, se emite uno NUEVO (y
    se reemplaza la cookie) en vez de reutilizar el mismo por sus 30 días
    completos — así una cookie de refresh vieja/filtrada deja de ser útil
    en cuanto el dueño legítimo vuelve a usar la suya.
    """
    usuario = _usuario_desde_refresh()
    if not usuario:
        return jsonify({"error": "Sesión inválida, vuelve a iniciar sesión", "code": "token_invalido"}), 401
    if not usuario.activo:
        return jsonify({"error": "Cuenta no disponible"}), 403

    respuesta, _ = _respuesta_con_sesion(usuario, con_usuario=False)
    return respuesta


@bp.post("/logout")
def logout():
    """Cierra la sesión en TODOS los dispositivos, no solo en este
    navegador: si la cookie de refresh sigue siendo válida, identificamos
    al usuario y subimos su sesion_version, lo que invalida de inmediato
    cualquier access/refresh token ya emitido (los de este navegador y los
    de cualquier otro donde haya iniciado sesión). Si la cookie ya no es
    válida (expiró, no existe, fue manipulada), no hay nada que revocar:
    de todas formas limpiamos la cookie de este navegador."""
    usuario = _usuario_desde_refresh()
    if usuario:
        usuario.sesion_version += 1
        db.session.commit()

    respuesta = jsonify({"mensaje": "Sesión cerrada"})
    _borrar_cookies_refresh(respuesta)
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
    # Cambiar la contraseña cierra la sesión en CUALQUIER OTRO dispositivo
    # donde haya un token activo (ver sesion_version). A este mismo
    # dispositivo/pestaña, en cambio, le damos un par de tokens nuevos ya
    # con el sesion_version actualizado, así la persona no tiene que
    # volver a loguearse justo después de cambiar su propia contraseña.
    usuario.sesion_version += 1
    db.session.commit()

    respuesta, _ = _respuesta_con_sesion(
        usuario, con_usuario=False, extra={"mensaje": "Contraseña actualizada correctamente"}
    )
    return respuesta


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

        link = f"{current_app.config['FRONTEND_TIENDA_URL']}/restablecer-password?token={registro_token.token}"

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
    # Si era una cuenta creada solo con el correo (registro rápido o compra
    # como invitado), al elegir contraseña pasa a ser una cuenta completa.
    usuario.es_invitado = False
    registro_token.usado = True  # de un solo uso: no se puede volver a usar este link
    # Si alguien tenía el password anterior comprometido y una sesión ya
    # abierta con él, este reset también la mata: cualquier token emitido
    # antes de este momento deja de servir.
    usuario.sesion_version += 1
    db.session.commit()
    return jsonify({"mensaje": "Contraseña restablecida correctamente, ya puedes ingresar"})


# =========================================================================
# Mi Cuenta > Configuración: preferencias, verificación en dos pasos,
# descarga de datos y eliminación de la cuenta.
# =========================================================================

def _estado_seguridad(usuario):
    return {
        "acepta_promociones": bool(usuario.acepta_promociones),
        "totp_activo": bool(usuario.totp_activo),
        "codigos_respaldo_restantes": totp.cantidad_codigos_respaldo(usuario.codigos_respaldo) if usuario.totp_activo else 0,
        # Las cuentas creadas con Google o como invitado no tienen contraseña
        # propia: para eliminarlas se confirma escribiendo ELIMINAR.
        "requiere_password": bool(usuario.password_hash),
    }


@bp.get("/preferencias")
@requiere_activo
def obtener_preferencias():
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    return jsonify(_estado_seguridad(usuario))


@bp.put("/preferencias")
@requiere_activo
def actualizar_preferencias():
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True) or {}
    if not isinstance(data.get("acepta_promociones"), bool):
        return jsonify({"error": "Indica si quieres recibir promociones (sí o no)"}), 400
    usuario.acepta_promociones = data["acepta_promociones"]
    db.session.commit()
    return jsonify(_estado_seguridad(usuario))


# ---------------------------------------------------- verificación en dos pasos
@bp.post("/2fa/iniciar")
@requiere_activo
@limiter.limit("10 per hour")
def iniciar_2fa():
    """Paso 1: genera un secreto nuevo (todavía NO activo) para escanear en la app."""
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    if usuario.totp_activo:
        return jsonify({"error": "La verificación en dos pasos ya está activada"}), 400
    secreto = totp.generar_secreto()
    usuario.totp_secreto = totp.cifrar(secreto)
    usuario.totp_ultimo_paso = None
    db.session.commit()
    return jsonify({"secreto": secreto, "uri": totp.uri_otpauth(secreto, usuario.email)})


@bp.post("/2fa/activar")
@requiere_activo
@limiter.limit("10 per 10 minutes")
def activar_2fa():
    """Paso 2: confirma con un código de la app. Devuelve los códigos de respaldo (una sola vez)."""
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    if usuario.totp_activo:
        return jsonify({"error": "La verificación en dos pasos ya está activada"}), 400
    secreto = totp.descifrar(usuario.totp_secreto) if usuario.totp_secreto else None
    if not secreto:
        return jsonify({"error": "Primero genera el código QR para configurar la app"}), 400

    data = request.get_json(force=True) or {}
    paso = totp.verificar_codigo(secreto, data.get("codigo"))
    if paso is None:
        return jsonify({"error": "El código no es correcto. Revisa que la hora de tu celular sea automática e inténtalo de nuevo."}), 400

    codigos, guardados = totp.generar_codigos_respaldo()
    usuario.totp_activo = True
    usuario.totp_ultimo_paso = paso
    usuario.codigos_respaldo = guardados
    db.session.commit()

    enviar_correo(
        destinatario=usuario.email,
        asunto="Activaste la verificación en dos pasos",
        texto=(
            f"Hola {usuario.nombre},\n\n"
            "Se activó la verificación en dos pasos en tu cuenta de Anita New Style. "
            "Desde ahora, además de tu contraseña, te pediremos un código de tu app de autenticación al iniciar sesión.\n\n"
            "Si no fuiste tú, cambia tu contraseña de inmediato."
        ),
    )
    return jsonify({**_estado_seguridad(usuario), "codigos_respaldo": codigos})


def _validar_codigo_2fa_activo():
    """Para acciones sensibles sobre una cuenta con 2FA ya activo (desactivarlo,
    pedir códigos nuevos): carga al usuario, exige 2FA activo, respeta el bloqueo
    por intentos y valida el código enviado.

    Devuelve (usuario, None) si todo está bien (intentos ya reseteados, sin commit)
    o (None, (respuesta, código_http)) si hay que cortar con un error."""
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    if not usuario.totp_activo:
        return None, (jsonify({"error": "La verificación en dos pasos no está activada"}), 400)
    data = request.get_json(force=True) or {}
    if usuario.esta_bloqueado:
        return None, (jsonify({"error": "Demasiados intentos fallidos. Intenta de nuevo en unos minutos."}), 429)

    valido, _ = _verificar_segundo_factor(usuario, data.get("codigo"))
    if not valido:
        usuario.registrar_intento_fallido()
        db.session.commit()
        return None, (jsonify({"error": "El código no es correcto"}), 400)

    usuario.resetear_intentos_fallidos()
    return usuario, None


@bp.post("/2fa/desactivar")
@requiere_activo
@limiter.limit("10 per 10 minutes")
def desactivar_2fa():
    usuario, error = _validar_codigo_2fa_activo()
    if error:
        return error

    usuario.totp_activo = False
    usuario.totp_secreto = None
    usuario.totp_ultimo_paso = None
    usuario.codigos_respaldo = None
    db.session.commit()

    enviar_correo(
        destinatario=usuario.email,
        asunto="Desactivaste la verificación en dos pasos",
        texto=(
            f"Hola {usuario.nombre},\n\n"
            "Se desactivó la verificación en dos pasos de tu cuenta de Anita New Style.\n\n"
            "Si no fuiste tú, cambia tu contraseña de inmediato."
        ),
    )
    return jsonify(_estado_seguridad(usuario))


@bp.post("/2fa/codigos-nuevos")
@requiere_activo
@limiter.limit("10 per 10 minutes")
def regenerar_codigos_respaldo():
    """Reemplaza los códigos de respaldo (los anteriores dejan de servir)."""
    usuario, error = _validar_codigo_2fa_activo()
    if error:
        return error

    codigos, guardados = totp.generar_codigos_respaldo()
    usuario.codigos_respaldo = guardados
    db.session.commit()
    return jsonify({**_estado_seguridad(usuario), "codigos_respaldo": codigos})


# ------------------------------------------------------------ descargar datos
@bp.get("/mis-datos")
@requiere_activo
@limiter.limit("10 per hour")
def descargar_mis_datos():
    """Copia de la información de la cuenta de quien la pide (JSON)."""
    from app.models import Pedido, Favorito, Resena

    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    pedidos = usuario.pedidos.order_by(Pedido.fecha_creacion.desc()).all()
    favoritos = Favorito.query.filter_by(usuario_id=usuario.id).all()
    resenas = Resena.query.filter_by(usuario_id=usuario.id).all()

    return jsonify({
        "generado_en": datetime.utcnow().isoformat() + "Z",
        "cuenta": {
            **usuario.to_dict(incluir_direccion=True),
            "fecha_registro": usuario.fecha_registro.isoformat() if usuario.fecha_registro else None,
            "recibe_promociones": bool(usuario.acepta_promociones),
            "verificacion_en_dos_pasos": bool(usuario.totp_activo),
        },
        "pedidos": [p.to_dict() for p in pedidos],
        "favoritos": [
            {"producto": f.producto.nombre if f.producto else None, "agregado_en": f.fecha_creacion.isoformat() if f.fecha_creacion else None}
            for f in favoritos
        ],
        "resenas": [
            {
                "producto_id": r.producto_id,
                "calificacion": r.calificacion,
                "comentario": r.comentario,
                "fecha": r.fecha_creacion.isoformat() if r.fecha_creacion else None,
            }
            for r in resenas
        ],
    })


# ---------------------------------------------------------- eliminar la cuenta
@bp.delete("/cuenta")
@requiere_activo
@limiter.limit("5 per hour")
def eliminar_cuenta():
    """
    Elimina la cuenta de quien la pide. No se borra la fila: los pedidos ya
    hechos se conservan (los necesita la tienda para su contabilidad y
    postventa), pero los datos personales de la cuenta se anonimizan y la
    cuenta queda inutilizable. Las reseñas quedan como "Cuenta eliminada".
    """
    from app.models import Pedido, Favorito, ItemCarrito

    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json(force=True) or {}

    if usuario.rol != "cliente" or usuario.es_admin:
        return jsonify({"error": "Las cuentas del equipo se eliminan desde el panel de usuarios, no desde aquí"}), 403

    if (data.get("confirmacion") or "").strip().upper() != "ELIMINAR":
        return jsonify({"error": "Escribe ELIMINAR para confirmar"}), 400

    if usuario.esta_bloqueado:
        return jsonify({"error": "Demasiados intentos fallidos. Intenta de nuevo en unos minutos."}), 429

    en_curso = usuario.pedidos.filter(Pedido.estado.notin_(["entregado", "cancelado"])).count()
    if en_curso:
        return jsonify({
            "error": f"Tienes {en_curso} pedido(s) en curso. Podrás eliminar tu cuenta cuando se entreguen o se cancelen.",
            "code": "pedidos_en_curso",
        }), 409

    if usuario.password_hash and not usuario.check_password(data.get("password") or ""):
        usuario.registrar_intento_fallido()
        db.session.commit()
        return jsonify({"error": "Tu contraseña no es correcta"}), 400

    if usuario.totp_activo:
        valido, _ = _verificar_segundo_factor(usuario, data.get("codigo_2fa"))
        if not valido:
            usuario.registrar_intento_fallido()
            db.session.commit()
            return jsonify({"error": "El código de verificación no es correcto"}), 400

    correo_anterior, nombre_anterior = usuario.email, usuario.nombre

    # Se quitan los datos personales (el correo se reemplaza por uno inválido y
    # único, porque la columna es única) y se cierra toda sesión abierta.
    usuario.nombre = "Cuenta"
    usuario.apellido = "eliminada"
    usuario.email = f"eliminado-{usuario.id}-{secrets.token_hex(4)}@cuenta-eliminada.invalid"
    usuario.telefono = None
    usuario.google_id = None
    usuario.tipo_documento = None
    usuario.numero_documento = None
    usuario.direccion = None
    usuario.referencia = None
    usuario.distrito_id = None
    usuario.password_hash = None
    usuario.activo = False
    usuario.acepta_promociones = False
    usuario.totp_activo = False
    usuario.totp_secreto = None
    usuario.totp_ultimo_paso = None
    usuario.codigos_respaldo = None
    usuario.es_invitado = False
    usuario.sesion_version += 1
    usuario.eliminado_en = datetime.utcnow()

    ItemCarrito.query.filter_by(usuario_id=usuario.id).delete()
    Favorito.query.filter_by(usuario_id=usuario.id).delete()
    TokenRecuperacion.query.filter_by(usuario_id=usuario.id).delete()
    db.session.commit()

    enviar_correo(
        destinatario=correo_anterior,
        asunto="Tu cuenta de Anita New Style fue eliminada",
        texto=(
            f"Hola {nombre_anterior},\n\n"
            "Confirmamos que tu cuenta de Anita New Style fue eliminada y que ya no podrás iniciar sesión con ella. "
            "Conservamos el historial de pedidos ya realizados solo para fines contables y de postventa.\n\n"
            "Si no pediste esto, escríbenos cuanto antes."
        ),
    )
    respuesta = jsonify({"mensaje": "Tu cuenta fue eliminada"})
    _borrar_cookies_refresh(respuesta)
    return respuesta
