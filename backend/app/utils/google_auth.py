"""
Verificación de ID tokens de Google (Google Identity Services).

Usa la librería oficial google-auth: valida la firma contra las llaves
públicas de Google, la expiración, el emisor (accounts.google.com) y que el
"aud" sea nuestro GOOGLE_CLIENT_ID.
"""
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class TokenGoogleInvalido(Exception):
    pass


def verificar_token_google(credential, client_id):
    """Devuelve {sub, email, nombre, apellido} o lanza TokenGoogleInvalido."""
    try:
        info = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id, clock_skew_in_seconds=10
        )
    except ValueError:
        raise TokenGoogleInvalido("No pudimos verificar tu cuenta de Google. Inténtalo de nuevo.")
    except Exception:
        # Fallo de red al bajar las llaves públicas de Google, etc.
        raise TokenGoogleInvalido("No pudimos conectar con Google. Inténtalo de nuevo en un momento.")

    if info.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise TokenGoogleInvalido("Token de Google inválido.")

    email = (info.get("email") or "").lower().strip()
    if not email or not info.get("email_verified"):
        raise TokenGoogleInvalido("Tu correo de Google no está verificado.")

    nombre = (info.get("given_name") or "").strip()
    apellido = (info.get("family_name") or "").strip()
    if not nombre:
        completo = (info.get("name") or "").strip()
        partes = completo.split(None, 1)
        nombre = partes[0] if partes else email.split("@")[0]
        if not apellido and len(partes) > 1:
            apellido = partes[1]
    # apellido es obligatorio (NOT NULL) en la tabla; algunas cuentas de
    # Google no lo traen. Se puede corregir después desde "Mi perfil".
    apellido = apellido or "-"

    return {"sub": info["sub"], "email": email, "nombre": nombre, "apellido": apellido}
