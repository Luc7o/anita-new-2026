"""
Envía un correo de prueba con la configuración de Resend actual (la de tu .env),
para verificar que el envío de correos realmente funciona.

Uso:
    python probar_correo.py tucorreo@ejemplo.com
"""
import sys
from app import create_app
from app.utils.correo import enviar_correo, resend_configurado

app = create_app()


def probar(destinatario):
    with app.app_context():
        if not resend_configurado():
            print("❌ No tienes RESEND_API_KEY configurada en tu .env — no se puede enviar nada de verdad.")
            print("   Revisa la sección de correo en el .env.example.")
            sys.exit(1)

        print(f"→ Remitente: {app.config.get('RESEND_FROM_EMAIL')}")
        print(f"→ Enviando correo de prueba a: {destinatario} ...")

        ok, error = enviar_correo(
            destinatario=destinatario,
            asunto="Correo de prueba — Anita New Style",
            texto="Si recibiste este correo, tu configuración de Resend está funcionando correctamente.",
        )
        if ok:
            print("✅ Correo enviado sin errores. Revisa la bandeja de entrada (y spam) de ese correo.")
        else:
            print(f"❌ Falló el envío: {error}")
            print("   Causas comunes: API key incorrecta o revocada, o el dominio del")
            print("   remitente (RESEND_FROM_EMAIL) todavía no está verificado en Resend.")
            sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python probar_correo.py tucorreo@ejemplo.com")
        sys.exit(1)
    probar(sys.argv[1])
