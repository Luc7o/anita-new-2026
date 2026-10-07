"""
Envío de correos transaccionales vía Resend (https://resend.com).

Se usa para:
- Correo de bienvenida / confirmación al registrarse
- Correo de recuperación de contraseña
- Correo de prueba desde el panel admin

Si no hay RESEND_API_KEY configurada en el .env, no se envía nada de verdad:
el asunto y el contenido se imprimen en la consola donde corre `python run.py`,
para poder seguir probando el flujo completo mientras se desarrolla o mientras
todavía no se tiene la cuenta de Resend lista.
"""
import resend
from flask import current_app


def resend_configurado():
    return bool(current_app.config.get("RESEND_API_KEY"))


def enviar_correo(destinatario, asunto, texto, html=None):
    """
    Envía un correo transaccional.

    Devuelve (ok: bool, error: str | None). `ok` es True tanto si el correo
    se envió de verdad como si se imprimió en consola por falta de API key
    (para no romper flujos como "olvidé mi contraseña" mientras se desarrolla).
    """
    if not resend_configurado():
        print(f"\n[DEV-CORREO] RESEND_API_KEY no configurada, no se envía nada de verdad.")
        print(f"[DEV-CORREO] Para: {destinatario}")
        print(f"[DEV-CORREO] Asunto: {asunto}")
        print(f"[DEV-CORREO] Contenido:\n{texto}\n")
        return True, None

    resend.api_key = current_app.config["RESEND_API_KEY"]
    remitente = current_app.config.get("RESEND_FROM_EMAIL", "no-responder@anitanewstyle.com")

    payload = {
        "from": remitente,
        "to": [destinatario],
        "subject": asunto,
        "text": texto,
    }
    if html:
        payload["html"] = html

    try:
        resend.Emails.send(payload)
        print(f"[CORREO] Enviado a {destinatario} — asunto: {asunto}")
        return True, None
    except Exception as e:
        current_app.logger.error(f"Error enviando correo con Resend a {destinatario}: {e}")
        print(f"\n❌ [CORREO] No se pudo enviar a {destinatario}")
        print(f"❌ [CORREO] Error: {e}")
        return False, str(e)
