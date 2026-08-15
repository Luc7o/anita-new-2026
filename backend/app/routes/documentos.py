import re
from flask import Blueprint, request, jsonify
from app.extensions import limiter
from app.utils.documento import consultar_documento, api_peru_configurada

bp = Blueprint("documentos", __name__, url_prefix="/api/documentos")

PATRONES = {
    "dni": re.compile(r"^\d{8}$"),
    "ruc": re.compile(r"^\d{11}$"),
    "ce": re.compile(r"^[A-Za-z0-9]{6,15}$"),
}


@bp.get("/consultar")
@limiter.limit("15 per hour")
def consultar():
    """
    Consulta un DNI o RUC contra APIs Perú para autocompletar el registro.
    Público (se usa antes de crear la cuenta), pero limitado por IP para no
    agotar los créditos de la API con abuso.
    """
    tipo = (request.args.get("tipo") or "").lower().strip()
    numero = (request.args.get("numero") or "").strip()

    if tipo not in PATRONES:
        return jsonify({"error": "Tipo de documento inválido"}), 400
    if not PATRONES[tipo].match(numero):
        return jsonify({"error": "El número de documento no tiene un formato válido"}), 400

    if tipo == "ce":
        return jsonify({
            "error": "El Carné de Extranjería no se valida automáticamente todavía, "
                     "puedes ingresarlo manualmente."
        }), 400

    if not api_peru_configurada():
        return jsonify({"error": "La validación de documentos todavía no está configurada"}), 503

    ok, datos, error = consultar_documento(tipo, numero)
    if not ok:
        return jsonify({"error": error}), 502

    return jsonify(datos)
