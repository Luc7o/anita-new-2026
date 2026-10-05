"""
Genera las versiones livianas (thumb / med / lg, en WebP) de las imágenes que
ya estaban subidas a Vercel Blob ANTES de que existiera la optimización.

Qué hace con cada imagen de producto y de promoción:
  1. Si ya tiene su versión thumb, la salta (se puede correr varias veces).
  2. Descarga el original, genera las 3 versiones y las sube junto al original
     (mismo nombre + _thumb.webp / _med.webp / _lg.webp).

Qué NO hace:
  - No modifica la base de datos: las URLs guardadas siguen siendo las mismas.
  - No borra ni reemplaza los originales (son tu respaldo; si algún día
    quieres liberar espacio en Blob, se pueden borrar después de verificar).
  - No toca los QR de pago ni los comprobantes.

Uso (desde la carpeta backend, con el .env cargado, como aplicar_migraciones.py):
    python optimizar_imagenes_existentes.py --simular     # solo lista, no sube nada
    python optimizar_imagenes_existentes.py --limite 5    # prueba con 5 imágenes
    python optimizar_imagenes_existentes.py               # procesa todas

Requiere BLOB_READ_WRITE_TOKEN en el entorno (el mismo que usa el backend).
"""
import argparse
from urllib.parse import urlparse

import requests

from app import create_app
from app.models import ImagenProducto, Producto, Promocion
from app.utils.imagenes import (
    ImagenInvalida,
    _subir,
    generar_variantes,
    ruta_variante,
)

app = create_app()

TIMEOUT = 30
# Se descarta cualquier archivo mayor a esto para no agotar la RAM del equipo.
MAX_BYTES_DESCARGA = 40 * 1024 * 1024


def _es_blob(url):
    return bool(url) and "blob.vercel-storage.com" in url


def recolectar_urls():
    urls = set()
    for (u,) in ImagenProducto.query.with_entities(ImagenProducto.url).all():
        urls.add(u)
    for (u,) in Producto.query.with_entities(Producto.imagen_url).all():
        urls.add(u)
    for (u,) in Promocion.query.with_entities(Promocion.imagen_url).all():
        urls.add(u)
    return sorted(u for u in urls if _es_blob(u))


def url_de_variante(url, sufijo):
    partes = urlparse(url)
    nueva_ruta = ruta_variante(partes.path, sufijo)
    return f"{partes.scheme}://{partes.netloc}{nueva_ruta}"


def ya_existe(url_variante):
    try:
        return requests.head(url_variante, timeout=TIMEOUT).status_code == 200
    except requests.RequestException:
        return False


def kb(n):
    return f"{n / 1024:,.0f} KB"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--simular", action="store_true", help="solo muestra qué se haría, no sube nada")
    parser.add_argument("--limite", type=int, default=0, help="procesar como máximo N imágenes")
    args = parser.parse_args()

    with app.app_context():
        urls = recolectar_urls()

    print(f"Imágenes de productos/promociones en Blob: {len(urls)}")
    procesadas = saltadas = fallidas = 0
    bytes_original = bytes_thumb = 0

    for url in urls:
        if args.limite and procesadas >= args.limite:
            break

        if ya_existe(url_de_variante(url, "thumb")):
            saltadas += 1
            continue

        if args.simular:
            print(f"[pendiente] {url}")
            procesadas += 1
            continue

        try:
            respuesta = requests.get(url, timeout=TIMEOUT, stream=True)
            respuesta.raise_for_status()
            trozos, total = [], 0
            for trozo in respuesta.iter_content(chunk_size=1024 * 256):
                total += len(trozo)
                if total > MAX_BYTES_DESCARGA:
                    raise ImagenInvalida("el archivo es demasiado grande")
                trozos.append(trozo)
            contenido = b"".join(trozos)

            variantes = generar_variantes(contenido, incluir_principal=False)
            partes = urlparse(url)
            ruta = partes.path.lstrip("/")
            for sufijo, datos in variantes.items():
                _subir(ruta_variante(ruta, sufijo), datos)

            procesadas += 1
            bytes_original += len(contenido)
            bytes_thumb += len(variantes["thumb"])
            print(f"[ok] {ruta}  {kb(len(contenido))} -> thumb {kb(len(variantes['thumb']))}")
        except Exception as e:  # una imagen mala no debe frenar a las demás
            fallidas += 1
            print(f"[error] {url}: {e}")

    print("\n--- Resumen ---")
    print(f"Procesadas: {procesadas} | Ya tenían versiones: {saltadas} | Con error: {fallidas}")
    if bytes_original:
        print(f"Originales procesados: {kb(bytes_original)} -> miniaturas: {kb(bytes_thumb)}")


if __name__ == "__main__":
    main()
