"""
Notificaciones por correo de los pedidos.

Qué correos salen (todos en español, con el mismo diseño de marca):

  Al cliente
  - Pago confirmado ("¡Gracias por tu compra!"), con la boleta en PDF adjunta.
  - Pedido listo para recoger en tienda, con su código de retiro de 6 dígitos.
  - Pedido enviado (delivery).
  - Pedido entregado.
  - Pedido cancelado (lo pidió el cliente, lo canceló la tienda, el pago fue
    rechazado o venció el plazo para pagar). Si ya había pagado, avisa que
    el reembolso está en camino.
  - Reembolso procesado.

  Al equipo de la tienda
  - Aviso de nueva compra pagada, a los correos de CORREOS_AVISO_PEDIDOS
    (si la variable está vacía, no se envía nada).

Reglas que se respetan en todas:

  1. Se llaman DESPUÉS del commit: si el pedido no se pudo guardar, no sale
     ningún correo diciendo que sí.
  2. Un correo que falla NUNCA rompe la operación (cobro, cambio de estado,
     cancelación...): se registra en el log y se sigue. Por eso cada función
     pública está envuelta en `_seguro`.
  3. Solo los pedidos ONLINE avisan al cliente. Una venta en mostrador ya se
     entrega en el momento y puede no tener correo.
  4. Todo texto que venga de la base (nombres, direcciones, productos) se
     escapa antes de ir al HTML.

Igual que utils/correo.py: sin RESEND_API_KEY el correo se imprime en la
consola en vez de enviarse, así se puede probar todo en local.
"""
import re
from functools import wraps
from html import escape

from flask import current_app

from app.extensions import db
from app.utils.correo import enviar_correo
from app.utils.formato import num

_RE_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Colores de marca (mismos de frontend/tailwind.config.js)
_BERRY = "#C42759"
_PLUM = "#2C0107"
_SUAVE = "#6B6A6B"
_FONDO = "#F7F5F5"
_LILA = "#F2E4E8"

# Cuántos correos de "pedido vencido" como máximo se mandan en una pasada del
# cron: la función serverless tiene un tiempo corto y los pedidos ya quedaron
# cancelados igual (el correo es solo el aviso).
MAX_AVISOS_VENCIDOS_POR_PASADA = 25


# ---------------------------------------------------------------- utilidades

def _seguro(funcion):
    """Que un fallo al armar o enviar un correo nunca llegue al flujo que lo llamó."""
    @wraps(funcion)
    def envoltura(*args, **kwargs):
        try:
            return funcion(*args, **kwargs)
        except Exception as error:  # noqa: BLE001
            current_app.logger.error(
                "No se pudo enviar la notificación %s: %s", funcion.__name__, error, exc_info=True
            )
            try:
                db.session.rollback()
            except Exception:  # noqa: BLE001
                pass
            return False
    return envoltura


def _dinero(valor):
    return f"S/ {num(valor)}"


def _url_tienda():
    return (current_app.config.get("FRONTEND_TIENDA_URL") or "").rstrip("/")


def _destinatario(pedido):
    """Correo del cliente: el del pedido y, si no sirve, el de su cuenta."""
    cliente = pedido.cliente
    if cliente is not None and cliente.eliminado_en:
        return None  # cuenta eliminada: sus datos ya no se usan
    for candidato in (pedido.envio_email, cliente.email if cliente is not None else None):
        correo = (candidato or "").strip()
        if _RE_EMAIL.match(correo):
            return correo
    return None


def _datos_resumen(pedido):
    filas = []
    for d in pedido.detalles:
        nombre = d.producto.nombre if d.producto else "Producto"
        variante = ", ".join(
            parte for parte in (
                f"Talla {d.talla}" if d.talla else "",
                f"Color {d.color}" if d.color else "",
            ) if parte
        )
        descripcion = f"{d.cantidad} x {nombre}" + (f" ({variante})" if variante else "")
        filas.append((descripcion, _dinero(d.subtotal)))

    costo_envio = float(pedido.costo_envio or 0)
    totales = [("Subtotal", _dinero(pedido.subtotal))]
    if pedido.tipo_entrega == "delivery":
        totales.append(("Envío", _dinero(costo_envio) if costo_envio else "Gratis"))
    totales.append(("Total", _dinero(pedido.total)))

    if pedido.tipo_entrega == "recojo":
        entrega = ["Recojo en tienda"]
    else:
        entrega = ["Delivery a domicilio"]
        direccion = ", ".join(p for p in (pedido.envio_direccion, pedido.envio_distrito) if p)
        if direccion:
            entrega.append(direccion)
        if pedido.envio_referencia:
            entrega.append(f"Referencia: {pedido.envio_referencia}")

    return {"numero": pedido.numero_pedido, "filas": filas, "totales": totales, "entrega": entrega}


# --------------------------------------------------------- armado del correo

def _texto_plano(saludo, parrafos, destacado, resumen, url):
    lineas = [saludo, ""]
    for parrafo in parrafos:
        lineas += [parrafo, ""]
    if destacado:
        lineas += [f"{destacado[0].upper()}: {destacado[1]}", ""]
    if resumen:
        lineas.append(f"Pedido {resumen['numero']}")
        lineas += [f"  {descripcion}: {monto}" for descripcion, monto in resumen["filas"]]
        lineas.append("")
        lineas += [f"{etiqueta}: {monto}" for etiqueta, monto in resumen["totales"]]
        lineas += ["", "Entrega:"] + [f"  {linea}" for linea in resumen["entrega"]]
        lineas.append("")
    if url:
        lineas += [f"Ver mi pedido: {url}", ""]
    lineas.append("— Anita New Style")
    return "\n".join(lineas)


def _html(titulo, saludo, parrafos, destacado, resumen, url):
    estilo_p = f"margin:0 0 14px;font-size:15px;line-height:1.55;color:{_PLUM};"
    cuerpo = f'<p style="{estilo_p}">{escape(saludo)}</p>'
    cuerpo += "".join(f'<p style="{estilo_p}">{escape(p)}</p>' for p in parrafos)

    if destacado:
        etiqueta, valor = destacado
        cuerpo += (
            f'<div style="margin:6px 0 18px;padding:16px;background:{_LILA};border-radius:12px;text-align:center;">'
            f'<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:{_SUAVE};">{escape(etiqueta)}</div>'
            f'<div style="margin-top:6px;font-size:32px;font-weight:700;letter-spacing:.3em;color:{_BERRY};'
            f'font-family:Consolas,Menlo,monospace;">{escape(valor)}</div></div>'
        )

    if resumen:
        celda = "padding:6px 0;font-size:14px;color:%s;border-bottom:1px solid #EEE4E7;" % _PLUM
        filas = "".join(
            f'<tr><td style="{celda}">{escape(descripcion)}</td>'
            f'<td style="{celda}text-align:right;white-space:nowrap;">{escape(monto)}</td></tr>'
            for descripcion, monto in resumen["filas"]
        )
        totales = "".join(
            f'<tr><td style="padding:4px 0;font-size:14px;color:{_SUAVE};">{escape(etiqueta)}</td>'
            f'<td style="padding:4px 0;font-size:14px;text-align:right;color:{_PLUM};'
            f'{"font-weight:700;" if etiqueta == "Total" else ""}">{escape(monto)}</td></tr>'
            for etiqueta, monto in resumen["totales"]
        )
        entrega = "<br>".join(escape(linea) for linea in resumen["entrega"])
        cuerpo += (
            f'<h3 style="margin:22px 0 8px;font-size:14px;color:{_PLUM};">Pedido {escape(resumen["numero"])}</h3>'
            f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{filas}</table>'
            f'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;">{totales}</table>'
            f'<h3 style="margin:18px 0 6px;font-size:14px;color:{_PLUM};">Entrega</h3>'
            f'<p style="margin:0;font-size:14px;line-height:1.5;color:{_SUAVE};">{entrega}</p>'
        )

    if url:
        cuerpo += (
            f'<p style="margin:26px 0 4px;"><a href="{escape(url, quote=True)}" '
            f'style="display:inline-block;padding:12px 24px;background:{_BERRY};color:#FFFFFF;'
            f'text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Ver mi pedido</a></p>'
        )

    return (
        f'<div style="margin:0;padding:24px 12px;background:{_FONDO};'
        f'font-family:\'DM Sans\',Helvetica,Arial,sans-serif;">'
        f'<table role="presentation" align="center" width="100%" cellspacing="0" cellpadding="0" '
        f'style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;">'
        f'<tr><td style="padding:20px 28px;background:{_BERRY};color:#FFFFFF;font-size:18px;'
        f'font-weight:700;letter-spacing:.02em;">Anita New Style</td></tr>'
        f'<tr><td style="padding:28px;">'
        f'<h1 style="margin:0 0 16px;font-size:22px;color:{_PLUM};">{escape(titulo)}</h1>'
        f'{cuerpo}</td></tr>'
        f'<tr><td style="padding:16px 28px;background:{_FONDO};font-size:12px;color:{_SUAVE};">'
        f'Este correo se envió automáticamente por tu compra en Anita New Style.</td></tr>'
        f'</table></div>'
    )


def _armar(pedido, titulo, parrafos, destacado=None, saludo=None, con_resumen=True, con_boton=True):
    saludo = saludo or f"Hola {(pedido.envio_nombre or 'cliente').strip()},"
    resumen = _datos_resumen(pedido) if con_resumen else None
    url = f"{_url_tienda()}/pedidos/{pedido.id}" if con_boton and _url_tienda() else None
    return (
        _texto_plano(saludo, parrafos, destacado, resumen, url),
        _html(titulo, saludo, parrafos, destacado, resumen, url),
    )


def _enviar_al_cliente(pedido, asunto, titulo, parrafos, destacado=None, adjuntos=None):
    if pedido.origen != "online":
        return False
    correo = _destinatario(pedido)
    if not correo:
        return False
    texto, html = _armar(pedido, titulo, parrafos, destacado=destacado)
    ok, _ = enviar_correo(correo, asunto, texto, html=html, adjuntos=adjuntos)
    return ok


# ------------------------------------------------------------ al equipo

def _avisar_equipo_nueva_compra(pedido):
    destinatarios = current_app.config.get("CORREOS_AVISO_PEDIDOS") or []
    if not destinatarios or pedido.origen != "online":
        return False

    metodo = pedido.metodo_pago_label
    parrafos = [
        f"Entró una compra pagada: {pedido.numero_pedido} por {_dinero(pedido.total)} ({metodo}).",
        f"Cliente: {pedido.envio_nombre or '-'}"
        + (f" · Tel. {pedido.envio_telefono}" if pedido.envio_telefono else ""),
        "Ya puedes prepararla desde el panel de administración.",
    ]
    texto, html = _armar(
        pedido, "Nueva compra pagada", parrafos, saludo="Hola equipo,", con_boton=False
    )
    enviado = False
    for correo in destinatarios:
        ok, _ = enviar_correo(correo, f"Nueva compra {pedido.numero_pedido} — {_dinero(pedido.total)}", texto, html=html)
        enviado = enviado or ok
    return enviado


# -------------------------------------------------------- funciones públicas

@_seguro
def notificar_pago_confirmado(pedido):
    """Compra pagada: correo al cliente (con la boleta) y aviso al equipo."""
    adjuntos = None
    if current_app.config.get("CORREO_ADJUNTAR_BOLETA"):
        try:
            from app.utils.boleta import generar_pdf_boleta
            adjuntos = [(f"boleta-{pedido.numero_pedido}.pdf", generar_pdf_boleta(pedido))]
        except Exception as error:  # noqa: BLE001
            # Sin la boleta el correo sale igual: ella siempre se puede
            # descargar desde "Mis pedidos".
            current_app.logger.warning("No se pudo adjuntar la boleta de %s: %s", pedido.numero_pedido, error)

    parrafos = [f"Recibimos el pago de tu pedido {pedido.numero_pedido}. ¡Gracias por elegirnos!"]
    if pedido.tipo_entrega == "recojo":
        parrafos.append("Cuando esté listo para retirar en la tienda te avisaremos por este mismo correo.")
    else:
        parrafos.append(
            f"Ya lo estamos preparando. Tiempo estimado de entrega: {pedido.entrega_estimada_label}."
        )
    if adjuntos:
        parrafos.append("Adjuntamos tu boleta de venta en PDF.")

    enviado = _enviar_al_cliente(
        pedido,
        f"Recibimos tu pago — pedido {pedido.numero_pedido}",
        "¡Gracias por tu compra!",
        parrafos,
        adjuntos=adjuntos,
    )
    try:
        _avisar_equipo_nueva_compra(pedido)
    except Exception as error:  # noqa: BLE001
        current_app.logger.error("No se pudo avisar al equipo de %s: %s", pedido.numero_pedido, error)
    return enviado


_MOTIVOS_CANCELACION = {
    "cliente": "Cancelaste tu pedido {n}.",
    "admin": "Nuestro equipo canceló tu pedido {n}. Si tienes dudas, escríbenos y te ayudamos.",
    "pago_rechazado": "No pudimos verificar el pago de tu pedido {n}, por eso quedó cancelado.",
    "vencimiento_pago": (
        "Tu pedido {n} se canceló porque no recibimos el pago dentro del plazo "
        "de {minutos} minutos."
    ),
}


@_seguro
def notificar_estado_pedido(pedido):
    """
    Avisa al cliente del estado ACTUAL del pedido. Solo hay correo para los
    estados que le sirven: listo para recoger, enviado, entregado y cancelado
    (el resto —confirmado, preparando— no envía nada para no llenarle la
    bandeja). Devuelve True si se envió un correo.
    """
    numero = pedido.numero_pedido

    if pedido.estado == "listo_recojo" and pedido.codigo_recojo:
        return _enviar_al_cliente(
            pedido,
            f"Tu pedido {numero} está listo para recoger",
            "Tu pedido está listo para recoger",
            [
                "Ya puedes retirar tu pedido en nuestra tienda. Cuando llegues, dile al personal "
                "este código de 6 dígitos: sirve para comprobar que eres tú.",
                "No lo compartas con nadie más.",
            ],
            destacado=("Tu código de recojo", pedido.codigo_recojo),
        )

    if pedido.estado == "enviado":
        return _enviar_al_cliente(
            pedido,
            f"Tu pedido {numero} va en camino",
            "Tu pedido va en camino",
            [
                f"Despachamos tu pedido {numero}. Tiempo estimado de entrega: "
                f"{pedido.entrega_estimada_label or 'próximamente'}.",
            ],
        )

    if pedido.estado == "entregado":
        return _enviar_al_cliente(
            pedido,
            f"Entregamos tu pedido {numero}",
            "Tu pedido fue entregado",
            [
                f"Marcamos tu pedido {numero} como entregado. ¡Gracias por comprar en Anita New Style!",
                "Si algo no llegó como esperabas, escríbenos y lo resolvemos. "
                "También puedes dejar tu reseña de los productos desde la tienda.",
            ],
        )

    if pedido.estado == "cancelado":
        motivo = _MOTIVOS_CANCELACION.get(
            pedido.motivo_cancelacion, "Tu pedido {n} fue cancelado."
        ).format(n=numero, minutos=current_app.config.get("MINUTOS_LIMITE_PAGO", 20))
        parrafos = [motivo]
        if pedido.estado_pago == "reembolso_pendiente":
            parrafos.append(
                "Como ya habías pagado, vamos a devolverte tu dinero. Te avisaremos por este "
                "correo cuando el reembolso esté procesado."
            )
        return _enviar_al_cliente(
            pedido, f"Pedido {numero} cancelado", "Tu pedido fue cancelado", parrafos
        )

    return False


@_seguro
def notificar_reembolso(pedido):
    """El reembolso de un pedido cancelado ya fue procesado."""
    return _enviar_al_cliente(
        pedido,
        f"Reembolso procesado — pedido {pedido.numero_pedido}",
        "Procesamos tu reembolso",
        [
            f"Devolvimos {_dinero(pedido.total)} del pedido {pedido.numero_pedido} al medio de pago "
            "con el que compraste.",
            "Según tu banco, puede tardar unos días en reflejarse en tu cuenta o tarjeta.",
        ],
    )
