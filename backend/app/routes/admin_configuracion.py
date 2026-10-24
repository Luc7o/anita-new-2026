import re
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
from app.models import ConfiguracionTienda
from app.utils.decorators import requiere_roles
from app.utils.correo import enviar_correo, resend_configurado
from app.roles import PUEDE_GESTIONAR_CONFIGURACION, PUEDE_VER_CONFIGURACION

bp = Blueprint("admin_configuracion", __name__, url_prefix="/api/admin/configuracion")

# Solo soles: los precios del sitio y el cobro de Culqi están en PEN. Aceptar
# otra moneda aquí no cambiaría ningún precio y daría una falsa impresión.
MONEDAS_VALIDAS = {"PEN"}

# Estos campos se pintan como enlaces (href) en la tienda: solo http(s), para
# que nadie pueda guardar un "javascript:..." que se ejecute al hacer clic.
_CAMPOS_URL = {"logo_url", "maps_url", "facebook_url", "instagram_url", "tiktok_url"}
_RE_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Campos de texto libre que se guardan tal cual (recortados a su largo de
# columna). correo_contacto y moneda se validan aparte porque tienen un
# formato que debe respetarse.
_CAMPOS_TEXTO = {
    "nombre_comercial": 120, "logo_url": 400, "telefono": 20, "whatsapp": 20,
    "direccion": 200, "referencia": 200, "ciudad": 80, "horario_atencion": 120,
    "maps_url": 400, "facebook_url": 200, "instagram_url": 200, "tiktok_url": 200,
}


def _config_o_503():
    """Devuelve (config, None), o (None, respuesta_503) si la tabla no existe
    aún en esta base (migración 040 pendiente): así el panel muestra un
    mensaje que se entiende en vez de un 'Error interno del servidor'."""
    try:
        return ConfiguracionTienda.obtener(), None
    except SQLAlchemyError:
        db.session.rollback()
        return None, (jsonify({
            "error": "La configuración de la tienda aún no está disponible: falta aplicar "
                     "la migración 040 en la base de datos."
        }), 503)


@bp.get("/tienda")
@requiere_roles(*PUEDE_VER_CONFIGURACION)
def obtener_configuracion_tienda():
    config, error = _config_o_503()
    if error:
        return error
    return jsonify(config.to_dict())


@bp.put("/tienda")
@requiere_roles(*PUEDE_GESTIONAR_CONFIGURACION)
def actualizar_configuracion_tienda():
    """Edita los datos generales de la tienda. Solo superadmin (ver
    PUEDE_GESTIONAR_CONFIGURACION)."""
    config, error = _config_o_503()
    if error:
        return error
    data = request.get_json(force=True) or {}

    if "nombre_comercial" in data and not (data.get("nombre_comercial") or "").strip():
        return jsonify({"error": "El nombre comercial no puede quedar vacío"}), 400

    if "correo_contacto" in data:
        correo = (data.get("correo_contacto") or "").strip()
        if correo and not _RE_EMAIL.match(correo):
            return jsonify({"error": "El correo de contacto no es válido"}), 400
        config.correo_contacto = correo[:120] or None

    if "moneda" in data:
        moneda = (data.get("moneda") or "").strip().upper()
        if moneda not in MONEDAS_VALIDAS:
            return jsonify({"error": "Moneda no soportada"}), 400
        config.moneda = moneda

    for campo, largo in _CAMPOS_TEXTO.items():
        if campo in data:
            valor = (data.get(campo) or "").strip()[:largo]
            if campo in _CAMPOS_URL and valor and not valor.lower().startswith(("https://", "http://")):
                return jsonify({"error": f"El enlace de {campo.replace('_', ' ')} debe empezar con https://"}), 400
            setattr(config, campo, valor or None)

    db.session.commit()
    return jsonify(config.to_dict())


@bp.post("/probar-correo")
@requiere_roles(*PUEDE_GESTIONAR_CONFIGURACION)
def probar_correo():
    """Envía un correo de prueba real, para verificar que el SMTP configurado funciona."""
    data = request.get_json(force=True) or {}
    destinatario = (data.get("email") or "").strip()

    if not destinatario:
        return jsonify({"error": "Indica a qué correo enviar la prueba"}), 400

    if not resend_configurado():
        return jsonify({
            "error": "No tienes RESEND_API_KEY configurada en el .env del backend — "
                     "sin eso, ningún correo puede salir de verdad (por ahora solo se "
                     "imprime en la consola del servidor)."
        }), 400

    ok, error = enviar_correo(
        destinatario=destinatario,
        asunto="Correo de prueba — Anita New Style",
        texto="Si recibiste este correo, tu configuración de Resend está funcionando correctamente.",
    )
    if not ok:
        return jsonify({"error": f"Falló el envío: {error}"}), 502

    return jsonify({"mensaje": f"Correo de prueba enviado a {destinatario}"})
