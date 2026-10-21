"""
Verificación en dos pasos (TOTP, RFC 6238) compatible con Google Authenticator,
Microsoft Authenticator, Authy, etc. Implementado con la librería estándar
(hmac/hashlib) para no sumar dependencias al despliegue.
"""
import base64
import hashlib
import hmac
import json
import secrets
import struct
import time
from urllib.parse import quote

from cryptography.fernet import Fernet, InvalidToken
from flask import current_app

PERIODO = 30          # segundos que dura cada código
DIGITOS = 6
VENTANA = 1           # se acepta el código anterior y el siguiente (desfase de reloj)
CANTIDAD_CODIGOS_RESPALDO = 8
EMISOR = "Anita New Style"


# ---------------------------------------------------------------- secreto
def generar_secreto():
    """Secreto aleatorio de 160 bits en base32 (el formato que leen las apps)."""
    return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")


def uri_otpauth(secreto, email):
    """Enlace otpauth:// que el QR codifica y las apps de autenticación entienden."""
    etiqueta = quote(f"{EMISOR}:{email}")
    return f"otpauth://totp/{etiqueta}?secret={secreto}&issuer={quote(EMISOR)}&digits={DIGITOS}&period={PERIODO}"


# ----------------------------------------------------------------- códigos
def _codigo(secreto, paso):
    clave = base64.b32decode(secreto + "=" * (-len(secreto) % 8), casefold=True)
    digest = hmac.new(clave, struct.pack(">Q", paso), hashlib.sha1).digest()
    desplazamiento = digest[-1] & 0x0F
    numero = struct.unpack(">I", digest[desplazamiento:desplazamiento + 4])[0] & 0x7FFFFFFF
    return str(numero % (10 ** DIGITOS)).zfill(DIGITOS)


def paso_actual(ahora=None):
    return int((time.time() if ahora is None else ahora) // PERIODO)


def verificar_codigo(secreto, codigo, ultimo_paso=None, ahora=None):
    """
    Devuelve el número de paso con el que coincidió el código, o None si no es
    válido. Un código ya usado (paso <= ultimo_paso) se rechaza: así no se puede
    reutilizar el mismo código dos veces dentro de su ventana de validez.
    """
    codigo = "".join(ch for ch in (codigo or "") if ch.isdigit())
    if len(codigo) != DIGITOS:
        return None
    actual = paso_actual(ahora)
    for paso in range(actual - VENTANA, actual + VENTANA + 1):
        if ultimo_paso is not None and paso <= ultimo_paso:
            continue
        if hmac.compare_digest(_codigo(secreto, paso), codigo):
            return paso
    return None


# ---------------------------------------------- cifrado del secreto en la BD
def _fernet():
    clave = hashlib.sha256(current_app.config["SECRET_KEY"].encode()).digest()
    return Fernet(base64.urlsafe_b64encode(clave))


def cifrar(texto):
    return _fernet().encrypt(texto.encode()).decode()


def descifrar(token):
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return None


# ------------------------------------------------------- códigos de respaldo
def _hash_respaldo(codigo):
    limpio = "".join(ch for ch in codigo.lower() if ch.isalnum())
    return hashlib.sha256(limpio.encode()).hexdigest()


def generar_codigos_respaldo():
    """(lista para mostrar al usuario UNA vez, JSON con sus hashes para guardar)."""
    codigos = []
    for _ in range(CANTIDAD_CODIGOS_RESPALDO):
        crudo = secrets.token_hex(5)  # 40 bits
        codigos.append(f"{crudo[:5]}-{crudo[5:]}")
    return codigos, json.dumps([_hash_respaldo(c) for c in codigos])


def consumir_codigo_respaldo(guardados_json, codigo):
    """Si el código está entre los guardados, lo gasta. Devuelve el JSON nuevo o None."""
    try:
        hashes = json.loads(guardados_json or "[]")
    except ValueError:
        return None
    candidato = _hash_respaldo(codigo or "")
    for guardado in hashes:
        if hmac.compare_digest(guardado, candidato):
            hashes.remove(guardado)
            return json.dumps(hashes)
    return None


def cantidad_codigos_respaldo(guardados_json):
    try:
        return len(json.loads(guardados_json or "[]"))
    except ValueError:
        return 0
