from flask import Blueprint, request, jsonify
from app.utils.decorators import requiere_roles
from app.utils.correo import enviar_correo, resend_configurado
from app.roles import PUEDE_GESTIONAR_CONFIGURACION

bp = Blueprint("admin_configuracion", __name__, url_prefix="/api/admin/configuracion")


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