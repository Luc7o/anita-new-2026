"""
Alertas al equipo cuando algo grave falla en producción: un cobro o reembolso
de Culqi con resultado incierto, la pasarela caída o un error 500.

Llegan por correo a ALERTAS_EMAIL (o, si no está, a CORREOS_AVISO_PEDIDOS),
con el mismo Resend que usa la tienda. Reglas:

- Nunca rompen la petición que las dispara: cualquier fallo se registra y ya.
- Antiespam: la misma alerta (misma `clave`) se manda como mucho una vez cada
  MINUTOS_ENTRE_ALERTAS. Con Redis la cuenta es compartida entre instancias.
- En local y en pruebas (sin RESEND_API_KEY) solo se escriben en el log.
"""
import logging
import time

from flask import current_app, has_request_context, request

from app.utils.cache import _cliente_redis, _fallo_redis

log = logging.getLogger(__name__)

MINUTOS_ENTRE_ALERTAS = 15
_ultimas_locales = {}


def _destinatarios():
    propios = current_app.config.get("ALERTAS_EMAIL") or []
    return propios or (current_app.config.get("CORREOS_AVISO_PEDIDOS") or [])


def _toca_avisar(clave):
    segundos = MINUTOS_ENTRE_ALERTAS * 60
    r = _cliente_redis()
    if r is not None:
        try:
            return bool(r.set(f"ans:alerta:{clave}", b"1", nx=True, ex=segundos))
        except Exception as exc:  # noqa: BLE001
            _fallo_redis(exc)
    ahora = time.monotonic()
    if ahora - _ultimas_locales.get(clave, -segundos) < segundos:
        return False
    _ultimas_locales[clave] = ahora
    return True


def alertar_equipo(clave, titulo, detalle):
    """Avisa al equipo. `clave` agrupa alertas iguales para el antiespam
    (p. ej. "culqi-incierto"), `detalle` es texto plano."""
    try:
        log.error("ALERTA [%s] %s — %s", clave, titulo, detalle)
        destinatarios = _destinatarios()
        if not destinatarios or not _toca_avisar(clave):
            return False

        from app.utils.correo import enviar_correo, resend_configurado

        if not resend_configurado():
            return False
        contexto = ""
        if has_request_context():
            contexto = f"\n\nPetición: {request.method} {request.path}"
        texto = (
            f"{detalle}{contexto}\n\n"
            f"(Si se repite, no se vuelve a avisar durante {MINUTOS_ENTRE_ALERTAS} minutos.)"
        )
        enviado = False
        for destinatario in destinatarios:
            ok, _ = enviar_correo(destinatario, f"[Alerta tienda] {titulo}", texto)
            enviado = enviado or ok
        return enviado
    except Exception:  # noqa: BLE001
        log.exception("No se pudo enviar la alerta %s", clave)
        return False
