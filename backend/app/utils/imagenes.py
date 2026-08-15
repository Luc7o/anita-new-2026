import os
import uuid
from flask import current_app
from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError


class ImagenInvalida(Exception):
    pass


def _extension_permitida(nombre_archivo):
    return (
        "." in nombre_archivo
        and nombre_archivo.rsplit(".", 1)[1].lower() in current_app.config["EXTENSIONES_PERMITIDAS"]
    )


def guardar_imagen(archivo_flask, subcarpeta):
    """
    Valida y guarda un archivo de imagen subido, dentro de
    app/static/uploads/<subcarpeta>/, y devuelve su URL absoluta.
    """
    if archivo_flask is None or archivo_flask.filename == "":
        raise ImagenInvalida("No se seleccionó ningún archivo")

    if not _extension_permitida(archivo_flask.filename):
        permitidas = ", ".join(current_app.config["EXTENSIONES_PERMITIDAS"])
        raise ImagenInvalida(f"Formato no permitido. Usa: {permitidas}")

    try:
        imagen = Image.open(archivo_flask.stream)
        imagen.verify()
        archivo_flask.stream.seek(0)
    except (UnidentifiedImageError, Exception):
        raise ImagenInvalida("El archivo no es una imagen válida")

    base_uploads = os.path.join(current_app.static_folder, "uploads", subcarpeta)
    os.makedirs(base_uploads, exist_ok=True)

    extension = secure_filename(archivo_flask.filename).rsplit(".", 1)[1].lower()
    nombre_unico = f"{uuid.uuid4().hex}.{extension}"
    archivo_flask.save(os.path.join(base_uploads, nombre_unico))

    from flask import request
    return f"{request.host_url.rstrip('/')}/static/uploads/{subcarpeta}/{nombre_unico}"
