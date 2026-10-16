from flask import Blueprint, jsonify
from sqlalchemy.exc import SQLAlchemyError
from app.extensions import db
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

    Si la tabla todavía no existe (migración 040 sin aplicar en esa base), la
    tienda sigue funcionando: se devuelven los valores por defecto, sin datos
    de contacto, en vez de un error 500 que dejaba esos bloques sin cargar.
    """
    try:
        datos = ConfiguracionTienda.obtener().to_dict()
        cache = "public, max-age=60"
    except SQLAlchemyError:
        db.session.rollback()
        datos = ConfiguracionTienda(nombre_comercial="Anita New Style", moneda="PEN").to_dict()
        cache = "no-store"
    datos.pop("actualizado_en", None)
    respuesta = jsonify(datos)
    respuesta.headers["Cache-Control"] = cache
    return respuesta
