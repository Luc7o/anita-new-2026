from flask import Blueprint, jsonify
from app.models import ConfiguracionTienda

bp = Blueprint("configuracion", __name__, url_prefix="/api/configuracion")


@bp.get("/tienda")
def tienda():
    """
    Datos públicos de la tienda (nombre, contacto, dirección física, redes)
    para que el frontend deje de depender de textos fijos. Solo expone
    información que de todos modos se publica en la web; no hay secretos
    aquí (las claves de Culqi, Resend, etc. viven solo en variables de
    entorno del backend y nunca pasan por esta tabla).
    """
    datos = ConfiguracionTienda.obtener().to_dict()
    datos.pop("actualizado_en", None)
    respuesta = jsonify(datos)
    respuesta.headers["Cache-Control"] = "public, max-age=60"
    return respuesta
