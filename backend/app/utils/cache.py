"""
Caché de las respuestas PÚBLICAS de la API (catálogo, categorías, reseñas,
promociones, ubicaciones).

Tres capas que trabajan juntas:

1. Servidor: la respuesta ya armada se guarda unos segundos, así que miles de
   visitas al catálogo no repiten la misma consulta a MySQL. Usa Redis si hay
   REDIS_URL (compartido entre todas las instancias serverless) y, si no, un
   diccionario en memoria del proceso (más limitado en Vercel: cada instancia
   tiene el suyo).
2. Navegador: Cache-Control + ETag. Volver a una página ya vista no descarga
   nada, y si hay que revalidar basta un 304 sin cuerpo.
3. CDN (opcional): con CACHE_EDGE=true se agrega s-maxage para que el edge de
   Vercel también sirva la respuesta sin ni siquiera despertar la función.

Invalidación: cualquier cambio exitoso desde el admin, un pedido nuevo (baja
el stock) o una reseña suben un "número de versión" global; las entradas de
la versión anterior dejan de usarse al instante. Lo único que no se puede
purgar es lo que ya está en el navegador/CDN: por eso esos tiempos son cortos.

Lo privado (carrito, pedidos, admin, auth) NUNCA se cachea: lleva
`Cache-Control: no-store`.
"""
import logging
import threading
import time
from functools import wraps

from flask import Response, current_app, make_response, request

log = logging.getLogger(__name__)

_CLAVE_VERSION = "ans:cache:version"

# Rutas cuyo cambio exitoso puede alterar lo que muestra el catálogo público
# (stock, precios, reseñas, promociones...). Carrito, favoritos, eventos y
# auth NO están: cambian con mucha frecuencia y no afectan al catálogo.
_PREFIJOS_QUE_INVALIDAN = ("/api/admin", "/api/pedidos", "/api/productos", "/api/jobs")

_lock = threading.Lock()
_memoria = {}          # clave -> (expira_en, cuerpo_bytes)
_version_local = 0
_redis = None
_redis_ok_desde = 0.0  # hasta cuándo NO volver a intentar Redis tras un fallo


def _cliente_redis():
    """Cliente Redis perezoso. Devuelve None si no hay REDIS_URL o está caído."""
    global _redis, _redis_ok_desde
    url = current_app.config.get("REDIS_URL")
    if not url or time.time() < _redis_ok_desde:
        return None
    if _redis is None:
        try:
            import redis

            _redis = redis.Redis.from_url(
                url, socket_timeout=0.4, socket_connect_timeout=0.4, decode_responses=False
            )
        except Exception:
            log.warning("Caché: no se pudo crear el cliente Redis; se usa memoria.")
            _redis_ok_desde = time.time() + 30
            return None
    return _redis


def _fallo_redis(exc):
    global _redis_ok_desde
    log.warning("Caché: Redis no responde (%s); se usa memoria 30 s.", exc)
    _redis_ok_desde = time.time() + 30


def _version():
    r = _cliente_redis()
    if r is not None:
        try:
            v = r.get(_CLAVE_VERSION)
            return int(v) if v else 0
        except Exception as exc:
            _fallo_redis(exc)
    return _version_local


def invalidar_cache_publico():
    """Descarta TODO lo cacheado del catálogo público (sube la versión)."""
    global _version_local
    with _lock:
        _version_local += 1
        _memoria.clear()
    r = _cliente_redis()
    if r is not None:
        try:
            r.incr(_CLAVE_VERSION)
        except Exception as exc:
            _fallo_redis(exc)


def _leer(clave):
    r = _cliente_redis()
    if r is not None:
        try:
            return r.get(clave)
        except Exception as exc:
            _fallo_redis(exc)
    with _lock:
        entrada = _memoria.get(clave)
        if entrada and entrada[0] > time.time():
            return entrada[1]
        _memoria.pop(clave, None)
    return None


def _guardar(clave, cuerpo, ttl):
    r = _cliente_redis()
    if r is not None:
        try:
            r.setex(clave, ttl, cuerpo)
            return
        except Exception as exc:
            _fallo_redis(exc)
    with _lock:
        if len(_memoria) > 500:  # tope simple para no crecer sin límite
            _memoria.clear()
        _memoria[clave] = (time.time() + ttl, cuerpo)


def cache_publico(ttl=60, navegador=30, swr=300):
    """
    Decorador para un GET público (sin sesión, misma respuesta para todos).

    ttl:       segundos que se guarda en el servidor.
    navegador: segundos que el navegador la reutiliza sin preguntar.
    swr:       segundos extra en que el navegador puede mostrar la copia
               vieja mientras revalida en segundo plano.
    """

    def decorador(vista):
        @wraps(vista)
        def envoltura(*args, **kwargs):
            clave = f"ans:c:{_version()}:{request.full_path}"
            cuerpo = _leer(clave)
            estado = "HIT"
            if cuerpo is None:
                respuesta = make_response(vista(*args, **kwargs))
                if respuesta.status_code != 200 or not respuesta.is_json:
                    return respuesta  # errores y redirecciones nunca se cachean
                cuerpo = respuesta.get_data()
                _guardar(clave, cuerpo, ttl)
                estado = "MISS"

            respuesta = Response(cuerpo, mimetype="application/json")
            cc = f"public, max-age={navegador}, stale-while-revalidate={swr}"
            if current_app.config.get("CACHE_EDGE"):
                cc += f", s-maxage={ttl}"
            respuesta.headers["Cache-Control"] = cc
            respuesta.headers["X-Cache"] = estado
            respuesta.add_etag()
            return respuesta.make_conditional(request)

        return envoltura

    return decorador


def registrar_cache(app):
    """Engancha invalidación automática y la política 'nada privado se cachea'."""

    @app.after_request
    def _politica_cache(respuesta):
        ruta = request.path
        if (
            request.method in ("POST", "PUT", "PATCH", "DELETE")
            and respuesta.status_code < 400
            and ruta.startswith(_PREFIJOS_QUE_INVALIDAN)
        ):
            invalidar_cache_publico()

        # Todo lo que no declaró su propia política (privado, admin, auth,
        # carrito, pedidos, PDFs...) se marca como no cacheable.
        if ruta.startswith("/api/") and "Cache-Control" not in respuesta.headers:
            respuesta.headers["Cache-Control"] = "private, no-store"
        return respuesta
