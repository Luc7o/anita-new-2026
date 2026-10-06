"""
Libro de Reclamaciones virtual — parte pública.

  GET  /api/reclamaciones/info   datos del proveedor para mostrar en la página
  POST /api/reclamaciones        registra una hoja de reclamación

Al registrar, el consumidor recibe la copia de su hoja en PDF dos veces: en la
misma respuesta (para descargarla al instante, como exige la norma para el
libro virtual) y por correo. Que el correo falle NO invalida el reclamo: ya
quedó registrado en la base de datos.
"""
import base64
import re
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from flask import Blueprint, current_app, jsonify, request

from app.extensions import db, limiter
from app.models import Reclamacion
from app.models.reclamacion import (
    DIAS_HABILES_RESPUESTA,
    TIPOS_BIEN,
    TIPOS_RECLAMACION,
    sumar_dias_habiles,
)
from app.utils.correo import enviar_correo
from app.utils.hoja_reclamacion import generar_pdf_hoja

bp = Blueprint("reclamaciones", __name__, url_prefix="/api/reclamaciones")

_RE_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_RE_DNI = re.compile(r"^\d{8}$")
_RE_CE = re.compile(r"^[A-Z0-9]{6,15}$")
_RE_TELEFONO = re.compile(r"^[0-9+\s-]{6,20}$")


def _texto(data, campo, minimo, maximo, etiqueta, obligatorio=True):
    valor = (data.get(campo) or "").strip()
    if not valor:
        if obligatorio:
            return None, f"{etiqueta} es obligatorio"
        return None, None
    if len(valor) < minimo:
        return None, f"{etiqueta} es demasiado corto"
    if len(valor) > maximo:
        return None, f"{etiqueta} no puede pasar de {maximo} caracteres"
    return valor, None


def _validar(data):
    """Devuelve (campos_limpios, error). Primer error encontrado, en español."""
    campos = {}
    for campo, minimo, maximo, etiqueta in (
        ("consumidor_nombre", 3, 150, "El nombre"),
        ("consumidor_domicilio", 5, 250, "El domicilio"),
        ("bien_descripcion", 3, 400, "La descripción del producto o servicio"),
        ("detalle", 10, 3000, "El detalle del reclamo"),
        ("pedido_consumidor", 5, 2000, "Tu pedido"),
    ):
        campos[campo], error = _texto(data, campo, minimo, maximo, etiqueta)
        if error:
            return None, error

    campos["apoderado_nombre"], error = _texto(data, "apoderado_nombre", 3, 150, "El nombre del apoderado", obligatorio=False)
    if error:
        return None, error
    campos["numero_pedido"], error = _texto(data, "numero_pedido", 1, 40, "El número de pedido", obligatorio=False)
    if error:
        return None, error

    doc_tipo = (data.get("consumidor_doc_tipo") or "").strip().upper()
    documento = (data.get("consumidor_documento") or "").strip().upper()
    if doc_tipo == "DNI":
        if not _RE_DNI.match(documento):
            return None, "El DNI debe tener 8 dígitos"
    elif doc_tipo == "CE":
        if not _RE_CE.match(documento):
            return None, "El carné de extranjería debe tener entre 6 y 15 letras o números"
    else:
        return None, "Elige el tipo de documento (DNI o CE)"
    campos["consumidor_doc_tipo"] = doc_tipo
    campos["consumidor_documento"] = documento

    telefono = (data.get("consumidor_telefono") or "").strip()
    if not _RE_TELEFONO.match(telefono):
        return None, "El teléfono no es válido"
    campos["consumidor_telefono"] = telefono

    email = (data.get("consumidor_email") or "").strip().lower()
    if len(email) > 150 or not _RE_EMAIL.match(email):
        return None, "El correo electrónico no es válido"
    campos["consumidor_email"] = email

    bien_tipo = (data.get("bien_tipo") or "").strip().lower()
    if bien_tipo not in TIPOS_BIEN:
        return None, "Indica si el reclamo es sobre un producto o un servicio"
    campos["bien_tipo"] = bien_tipo

    tipo = (data.get("tipo") or "").strip().lower()
    if tipo not in TIPOS_RECLAMACION:
        return None, "Indica si es un reclamo o una queja"
    campos["tipo"] = tipo

    monto = data.get("monto_reclamado")
    if monto in (None, ""):
        campos["monto_reclamado"] = None
    else:
        try:
            monto = Decimal(str(monto))
        except InvalidOperation:
            return None, "El monto reclamado no es válido"
        if monto < 0 or monto > Decimal("999999.99"):
            return None, "El monto reclamado no es válido"
        campos["monto_reclamado"] = monto.quantize(Decimal("0.01"))

    return campos, None


def _a_lima(dt):
    return dt - timedelta(hours=5)


@bp.get("/info")
def info():
    cfg = current_app.config
    return jsonify({
        "razon_social": cfg.get("PROVEEDOR_RAZON_SOCIAL") or "",
        "ruc": cfg.get("PROVEEDOR_RUC") or "",
        "domicilio": cfg.get("PROVEEDOR_DOMICILIO") or "",
        "plazo_dias_habiles": DIAS_HABILES_RESPUESTA,
    })


@bp.post("")
@limiter.limit("5 per hour")
def registrar():
    data = request.get_json(silent=True) or {}

    # Campo trampa: invisible para personas, los bots suelen llenarlo.
    if (data.get("sitio_web") or "").strip():
        return jsonify({"error": "No se pudo registrar el reclamo"}), 400

    campos, error = _validar(data)
    if error:
        return jsonify({"error": error}), 400

    ahora = datetime.utcnow()
    hoy_lima = _a_lima(ahora)

    reclamo = Reclamacion(
        fecha_registro=ahora,
        fecha_limite=sumar_dias_habiles(hoy_lima.date(), DIAS_HABILES_RESPUESTA),
        estado="pendiente",
        **campos,
    )
    db.session.add(reclamo)
    db.session.flush()  # asigna el id sin cerrar la transacción
    reclamo.codigo = f"{reclamo.id:06d}-{hoy_lima.year}"
    db.session.commit()

    pdf_bytes = None
    email_enviado = False
    try:
        pdf_bytes = generar_pdf_hoja(reclamo)
    except Exception as e:  # el reclamo ya está guardado; solo falta la copia
        current_app.logger.error(f"No se pudo generar la hoja {reclamo.codigo}: {e}")

    if pdf_bytes:
        adjunto = [(f"hoja-reclamacion-{reclamo.codigo}.pdf", pdf_bytes)]
        limite = reclamo.fecha_limite.strftime("%d/%m/%Y")
        email_enviado, _ = enviar_correo(
            reclamo.consumidor_email,
            f"Registramos tu {reclamo.tipo} N° {reclamo.codigo}",
            (
                f"Hola {reclamo.consumidor_nombre},\n\n"
                f"Registramos tu {reclamo.tipo} en nuestro Libro de Reclamaciones con el "
                f"número {reclamo.codigo}. Adjuntamos la copia de tu hoja de reclamación.\n\n"
                f"Te responderemos como máximo el {limite} (15 días hábiles), a este mismo correo.\n\n"
                "Anita New Style"
            ),
            adjuntos=adjunto,
        )
        destino = current_app.config.get("RECLAMOS_EMAIL_DESTINO")
        if destino:
            enviar_correo(
                destino,
                f"Nuevo {reclamo.tipo} N° {reclamo.codigo} — responder antes del {limite}",
                (
                    f"Se registró un {reclamo.tipo} en el Libro de Reclamaciones.\n\n"
                    f"N°: {reclamo.codigo}\nConsumidor: {reclamo.consumidor_nombre}\n"
                    f"Plazo de respuesta: hasta el {limite}\n\n"
                    "Respóndelo desde el panel admin, en la sección Libro de Reclamaciones."
                ),
                adjuntos=adjunto,
            )

    respuesta = {
        "codigo": reclamo.codigo,
        "fecha_limite": reclamo.fecha_limite.isoformat(),
        "email_enviado": bool(email_enviado),
    }
    if pdf_bytes:
        respuesta["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
    return jsonify(respuesta), 201
