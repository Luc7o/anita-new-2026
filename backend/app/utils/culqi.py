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


def culqi_configurado():
    return bool(current_app.config.get("CULQI_SECRET_KEY"))


def crear_cargo(pedido, usuario, token_id, email=None):
    """
    Crea un cargo en Culqi por el total del pedido, usando un token ya
    generado en el frontend (tarjeta o Yape).
    Devuelve (ok, cargo_id, error) — si ok es True, cargo_id es el id del
    cargo aprobado ("chr_..."). Si ok es False, error es un mensaje ya listo
    para mostrarle al cliente.
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
    except requests.RequestException as e:
        current_app.logger.error(f"Error de red creando cargo Culqi para pedido {pedido.id}: {e}")
        return False, None, "No se pudo contactar la pasarela de pago, intenta de nuevo"

    data = resp.json() if resp.content else {}

    if resp.status_code in (200, 201) and data.get("object") == "charge":
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

    current_app.logger.error(f"Respuesta inesperada de Culqi para pedido {pedido.id}: {resp.status_code} {data}")
    return False, None, "La pasarela de pago no respondió como esperábamos, intenta de nuevo"


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
    except requests.RequestException as e:
        current_app.logger.error(f"Error de red reembolsando pedido {pedido.id} en Culqi: {e}")
        return False, None, "No se pudo contactar la pasarela de pago para el reembolso, intenta de nuevo"

    data = resp.json() if resp.content else {}

    if resp.status_code in (200, 201) and data.get("object") == "refund":
        return True, data["id"], None

    if data.get("object") == "error":
        mensaje = data.get("user_message") or data.get("merchant_message") or "El reembolso no pudo procesarse"
        current_app.logger.error(f"Reembolso Culqi rechazado para pedido {pedido.id}: {data}")
        return False, None, mensaje

    current_app.logger.error(f"Respuesta inesperada de Culqi (reembolso) para pedido {pedido.id}: {resp.status_code} {data}")
    return False, None, "La pasarela de pago no respondió como esperábamos al reembolsar"
