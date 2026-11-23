"""
Integración con la pasarela de pago Culqi — cargo único, tarjeta y Yape.

Documentación oficial usada como referencia:
https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/cargos

A diferencia de TuPay, Culqi es SÍNCRONO: no hay redirección a una página
externa ni webhook que avisa después. El flujo completo es:

1. En el frontend, el widget de Culqi Checkout (tarjeta o Yape) tokeniza los
   datos sensibles (número de tarjeta, o teléfono + código de aprobación de
   Yape) directamente en el navegador del cliente — esos datos NUNCA pasan
   por nuestro backend, así que no tenemos que preocuparnos por PCI DSS.
   El widget devuelve un token id: "tkn_..." para tarjeta, "ype_..." para
   Yape.
2. El frontend manda ese token id a POST /pedidos/<id>/pagar.
3. Acá (crear_cargo) usamos el token para crear un cargo real contra Culqi
   con nuestra llave PRIVADA — la respuesta llega en la misma petición:
   aprobado o rechazado, sin esperar nada más.
"""
import requests
from flask import current_app

from app.utils.alertas import alertar_equipo


def _alertar(clave, titulo, pedido, detalle):
    numero = getattr(pedido, "numero_pedido", None) or "?"
    try:
        total = f"S/ {float(pedido.total):.2f}"
    except (TypeError, ValueError, AttributeError):
        total = "?"
    alertar_equipo(
        clave,
        titulo,
        f"Pedido {numero} (id {getattr(pedido, 'id', '?')}), total {total}.\n{detalle}\n\n"
        "Revisa el panel de Culqi antes de tocar el pedido: el cobro o reembolso pudo haberse hecho.",
    )


def culqi_configurado():
    return bool(current_app.config.get("CULQI_SECRET_KEY"))


def _json_o_vacio(resp):
    """Cuerpo JSON de la respuesta, o {} si viene vacío o no es JSON (p. ej. una página de error)."""
    if not resp.content:
        return {}
    try:
        datos = resp.json()
    except ValueError:
        return {}
    return datos if isinstance(datos, dict) else {}


# Resultado incierto: no sabemos si Culqi cobró (se cortó la conexión después de enviar el
# cargo, o respondió algo que no entendemos). NO se puede tratar como rechazo: el cliente
# reintentaría con otro token y se le cobraría dos veces.
INCIERTO = None


def crear_cargo(pedido, usuario, token_id, email=None):
    """
    Crea un cargo en Culqi por el total del pedido, usando un token ya
    generado en el frontend (tarjeta o Yape).

    Devuelve (ok, cargo_id, error):
      - ok True:  cargo aprobado; cargo_id es su id ("chr_...").
      - ok False: Culqi o el banco lo RECHAZARON con seguridad; error es un mensaje para el cliente.
      - ok None (INCIERTO): no se sabe si se cobró. Hay que revisarlo en el panel de Culqi
        antes de permitir otro intento de pago.
    """
    secret_key = current_app.config["CULQI_SECRET_KEY"]
    base_url = current_app.config["CULQI_BASE_URL"].rstrip("/")

    payload = {
        # Culqi recibe el monto en céntimos (100 = S/ 1.00)
        "amount": int(round(float(pedido.total) * 100)),
        "currency_code": "PEN",
        "email": (email or usuario.email)[:255],
        "source_id": token_id,
        "description": f"Pedido {pedido.numero_pedido} - Anita New Style",
        "metadata": {
            "pedido_id": pedido.id,
            "numero_pedido": pedido.numero_pedido,
        },
        # Recomendado por Culqi para que su motor antifraude tenga contexto
        # real del cliente y reduzca rechazos injustificados.
        "antifraud_details": {
            "first_name": usuario.nombre[:50],
            "last_name": usuario.apellido[:50],
            "address": (usuario.direccion or "")[:100] or None,
            "address_city": (usuario.distrito or usuario.provincia or "")[:50] or None,
            "country_code": "PE",
            **({"phone_number": usuario.telefono} if usuario.telefono else {}),
        },
    }

    try:
        resp = requests.post(
            f"{base_url}/v2/charges",
            json=payload,
            headers={"Authorization": f"Bearer {secret_key}"},
            timeout=20,
        )
    except requests.ConnectTimeout as e:
        # No se llegó a abrir la conexión: el cargo nunca salió de aquí, así que es seguro
        # decirle al cliente que reintente.
        current_app.logger.error(f"No se pudo conectar con Culqi para el pedido {pedido.id}: {e}")
        _alertar("culqi-sin-conexion", "Culqi no responde", pedido, f"No se pudo abrir la conexión al cobrar: {e}")
        return False, None, "No se pudo contactar la pasarela de pago, intenta de nuevo"
    except requests.RequestException as e:
        # Cualquier otro corte (ReadTimeout, conexión cerrada a mitad de respuesta...) puede
        # ocurrir DESPUÉS de que Culqi recibió el cargo: pudo cobrarse.
        current_app.logger.error(f"Culqi no respondió bien para el pedido {pedido.id}: {e}")
        _alertar("culqi-cobro-incierto", "Cobro con resultado incierto", pedido, f"La conexión se cortó a mitad del cobro: {e}")
        return INCIERTO, None, None

    data = _json_o_vacio(resp)

    if resp.status_code in (200, 201) and data.get("object") == "charge" and data.get("id"):
        return True, data["id"], None

    # Cargo rechazado por el banco/Culqi: el error trae un mensaje ya
    # pensado para mostrarle al cliente (user_message).
    if data.get("object") == "error":
        mensaje = data.get("user_message") or data.get("merchant_message") or "Tu pago no pudo procesarse"
        current_app.logger.info(
            f"Cargo Culqi rechazado para pedido {pedido.id}: "
            f"code={data.get('code')} decline_code={data.get('decline_code')}"
        )
        return False, None, mensaje

    # Ni cargo ni error de Culqi (un 5xx, una página HTML, un JSON raro): no sabemos si cobró.
    current_app.logger.error(f"Respuesta inesperada de Culqi para pedido {pedido.id}: {resp.status_code} {data}")
    _alertar("culqi-cobro-incierto", "Cobro con resultado incierto", pedido, f"Respuesta inesperada de Culqi: HTTP {resp.status_code}")
    return INCIERTO, None, None


def reembolsar_en_culqi(pedido, motivo="solicitud_comprador"):
    """
    Reembolsa en Culqi el cargo asociado a este pedido, usando su
    culqi_cargo_id ("chr_..."). Documentación:
    https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/reembolsos

    Devuelve (ok, reembolso_id, error). Si el pedido no tiene culqi_cargo_id
    (nunca se le cobró de verdad por acá, o es un pedido muy antiguo antes
    de que se guardara este campo), devuelve ok=False para que el admin
    gestione el reembolso manualmente en el panel de Culqi.

    `motivo` debe ser uno de los valores que acepta Culqi: "solicitud_comprador",
    "duplicado", "fraudulento", u "otro".
    """
    if not pedido.culqi_cargo_id:
        return False, None, "Este pedido no tiene un cargo Culqi registrado; reembólsalo manualmente desde el panel de Culqi"

    secret_key = current_app.config["CULQI_SECRET_KEY"]
    base_url = current_app.config["CULQI_BASE_URL"].rstrip("/")

    try:
        resp = requests.post(
            f"{base_url}/v2/refunds",
            json={"amount": int(round(float(pedido.total) * 100)), "charge_id": pedido.culqi_cargo_id, "reason": motivo},
            headers={"Authorization": f"Bearer {secret_key}"},
            timeout=20,
        )
    except requests.ConnectTimeout as e:
        current_app.logger.error(f"No se pudo conectar con Culqi para reembolsar el pedido {pedido.id}: {e}")
        _alertar("culqi-sin-conexion", "Culqi no responde", pedido, f"No se pudo abrir la conexión al reembolsar: {e}")
        return False, None, "No se pudo contactar la pasarela de pago para el reembolso, intenta de nuevo"
    except requests.RequestException as e:
        # Igual que al cobrar: el pedido de reembolso pudo llegar a Culqi.
        current_app.logger.error(f"Culqi no respondió bien al reembolsar el pedido {pedido.id}: {e}")
        _alertar("culqi-reembolso-incierto", "Reembolso con resultado incierto", pedido, f"La conexión se cortó a mitad del reembolso: {e}")
        return INCIERTO, None, None

    data = _json_o_vacio(resp)

    if resp.status_code in (200, 201) and data.get("object") == "refund":
        return True, data["id"], None

    if data.get("object") == "error":
        mensaje = data.get("user_message") or data.get("merchant_message") or "El reembolso no pudo procesarse"
        current_app.logger.error(f"Reembolso Culqi rechazado para pedido {pedido.id}: {data}")
        _alertar("culqi-reembolso-rechazado", "Culqi rechazó un reembolso", pedido, f"Mensaje de Culqi: {mensaje}")
        return False, None, mensaje

    current_app.logger.error(f"Respuesta inesperada de Culqi (reembolso) para pedido {pedido.id}: {resp.status_code} {data}")
    _alertar("culqi-reembolso-incierto", "Reembolso con resultado incierto", pedido, f"Respuesta inesperada de Culqi: HTTP {resp.status_code}")
    return INCIERTO, None, None
