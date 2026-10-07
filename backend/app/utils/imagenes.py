import re
import uuid
from io import BytesIO

from flask import current_app
from werkzeug.utils import secure_filename
from PIL import Image, ImageOps, UnidentifiedImageError
import vercel_blob


class ImagenInvalida(Exception):
    pass


# Protección contra "decompression bombs": una imagen pequeña en bytes pero
# con decenas de miles de píxeles por lado puede agotar la RAM al abrirla.
# Pillow avisa al pasar este límite y lanza error al duplicarlo.
Image.MAX_IMAGE_PIXELS = 60_000_000

# Versiones que se generan de cada imagen. Cada una es WebP y se guarda junto
# a la original con un sufijo en el nombre: <nombre>_thumb.webp, etc. Así no
# hace falta tocar la base de datos: el frontend deduce la URL de cada versión
# a partir de la URL guardada.
#   "" (principal) -> solo para subidas nuevas; reemplaza al archivo original
#   lg    -> carrusel del inicio (pantalla completa)
#   med   -> imagen grande de la ficha de producto
#   thumb -> tarjetas del catálogo, miniaturas, relacionados, panel admin
VARIANTES = (
    # (sufijo, lado máximo en px, calidad WebP)
    ("", 1920, 85),
    ("lg", 1600, 82),
    ("med", 1000, 80),
    ("thumb", 400, 75),
)


def _extension_permitida(nombre_archivo):
    return (
        "." in nombre_archivo
        and nombre_archivo.rsplit(".", 1)[1].lower() in current_app.config["EXTENSIONES_PERMITIDAS"]
    )


def ruta_variante(ruta, sufijo):
    """
    'uploads/productos/abc.png' + 'thumb' -> 'uploads/productos/abc_thumb.webp'
    Con sufijo vacío devuelve la versión principal: '.../abc.webp'.
    """
    nuevo = f"_{sufijo}.webp" if sufijo else ".webp"
    return re.sub(r"\.[A-Za-z0-9]+$", nuevo, ruta)


def generar_variantes(contenido, incluir_principal=True):
    """
    Recibe los bytes de una imagen y devuelve {sufijo: bytes_webp}.

    Se achica en cascada sobre la MISMA imagen en memoria (1920 -> 1600 ->
    1000 -> 400) en vez de reabrir el archivo para cada tamaño: así solo hay
    una imagen decodificada a la vez y el pico de RAM del servidor es el de
    la imagen más grande, no la suma de todas.

    Lanza ImagenInvalida si no es una imagen válida o si es un GIF animado
    (convertirlo a WebP estático perdería la animación).
    """
    try:
        imagen = Image.open(BytesIO(contenido))
        imagen.verify()
        imagen = Image.open(BytesIO(contenido))  # verify() deja el objeto inutilizable
    except Image.DecompressionBombError:
        raise ImagenInvalida("La imagen tiene demasiados píxeles")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise ImagenInvalida("El archivo no es una imagen válida")

    if getattr(imagen, "is_animated", False):
        raise ImagenInvalida("Las imágenes animadas no se pueden optimizar")

    try:
        # Solo afecta a JPEG: el decodificador entrega la imagen ya reducida
        # (1/2, 1/4 o 1/8) en vez de decodificar los 4K completos. Ahorra RAM
        # y tiempo; no hace nada en otros formatos.
        imagen.draft("RGB", (1920, 1920))
        # Respeta la orientación de las fotos de celular (EXIF) y descarta
        # los metadatos (ubicación GPS, modelo del equipo, etc.).
        imagen = ImageOps.exif_transpose(imagen)

        if imagen.mode in ("RGBA", "LA") or (imagen.mode == "P" and "transparency" in imagen.info):
            imagen = imagen.convert("RGBA")
        elif imagen.mode != "RGB":
            imagen = imagen.convert("RGB")

        resultado = {}
        for sufijo, lado, calidad in VARIANTES:
            if sufijo == "" and not incluir_principal:
                continue
            imagen.thumbnail((lado, lado), Image.LANCZOS)  # solo reduce, nunca agranda
            buffer = BytesIO()
            imagen.save(buffer, "WEBP", quality=calidad, method=4)
            resultado[sufijo] = buffer.getvalue()
        return resultado
    except Image.DecompressionBombError:
        raise ImagenInvalida("La imagen tiene demasiados píxeles")
    except (OSError, ValueError):
        raise ImagenInvalida("No se pudo procesar la imagen")


def _subir(pathname, contenido):
    resultado = vercel_blob.put(
        pathname,
        contenido,
        {"access": "public", "addRandomSuffix": "false"},
    )
    return resultado["url"]


def guardar_imagen(archivo_flask, subcarpeta, optimizar=True):
    """
    Valida y sube un archivo de imagen a Vercel Blob, dentro de
    uploads/<subcarpeta>/, y devuelve su URL pública.

    Con optimizar=True (por defecto) la imagen se convierte a WebP, se limita
    a 1920 px y se generan además las versiones lg / med / thumb. La URL
    devuelta es la de la versión principal. Con optimizar=False se sube el
    archivo tal cual (se usa para QR de pago, donde la nitidez exacta importa).
    """
    if archivo_flask is None or archivo_flask.filename == "":
        raise ImagenInvalida("No se seleccionó ningún archivo")

    if not _extension_permitida(archivo_flask.filename):
        permitidas = ", ".join(current_app.config["EXTENSIONES_PERMITIDAS"])
        raise ImagenInvalida(f"Formato no permitido. Usa: {permitidas}")

    contenido = archivo_flask.stream.read()
    base = uuid.uuid4().hex

    if not optimizar:
        try:
            Image.open(BytesIO(contenido)).verify()
        except Exception:
            raise ImagenInvalida("El archivo no es una imagen válida")
        extension = secure_filename(archivo_flask.filename).rsplit(".", 1)[1].lower()
        return _subir(f"uploads/{subcarpeta}/{base}.{extension}", contenido)

    try:
        variantes = generar_variantes(contenido)
    except ImagenInvalida as e:
        # Un GIF animado no se puede pasar a WebP sin perder la animación:
        # se sube tal cual y el frontend usa el original como respaldo.
        if "animadas" in str(e):
            return _subir(f"uploads/{subcarpeta}/{base}.gif", contenido)
        raise

    ruta_base = f"uploads/{subcarpeta}/{base}.webp"
    # Primero las versiones pequeñas y al final la principal: si algo falla
    # a mitad de camino, nunca queda guardada una URL principal sin sus
    # versiones.
    for sufijo in ("thumb", "med", "lg"):
        _subir(ruta_variante(ruta_base, sufijo), variantes[sufijo])
    return _subir(ruta_base, variantes[""])
