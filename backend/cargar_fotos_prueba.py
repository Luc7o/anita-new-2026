"""
Genera y carga FOTOS DE PRUEBA para los productos que no tienen ninguna imagen.

Las fotos son ilustraciones dibujadas aquí mismo (no se descarga nada de
internet): la silueta del producto según su tipo (cartera, mochila, calzado,
accesorio) en su color real, sobre un fondo de estudio, con 4 vistas por
producto (frente, lado, detalle y ambiente) y la marca "Foto de prueba".
Sirven para ver la tienda armada mientras llegan las fotos reales.

Qué hace con cada producto activo SIN imágenes:
  1. Dibuja 4 fotos (si tiene varios colores, reparte las vistas entre sus
     colores y cada foto queda ligada a su color, como al cargarlas en el admin).
  2. Las sube a Vercel Blob con sus versiones thumb / med / lg, igual que el
     admin, en uploads/productos/prueba/.
  3. Las registra en imagenes_producto y limpia el caché público.

Qué NO hace:
  - No toca productos que ya tienen fotos (salvo con --reemplazar-prueba, que
    solo reemplaza las que este mismo script subió antes).
  - No borra nada de Vercel Blob.

Uso (desde la carpeta backend, con el .env cargado, como aplicar_migraciones.py):
    python cargar_fotos_prueba.py --vista-previa fotos_previa   # solo dibuja en esa carpeta
    python cargar_fotos_prueba.py --simular                     # lista qué productos tocaría
    python cargar_fotos_prueba.py                               # dibuja, sube y registra
    python cargar_fotos_prueba.py --reemplazar-prueba           # rehace las fotos de prueba

Para una base LOCAL (entorno de diseño, sin Vercel Blob): las fotos se guardan en una
carpeta servida por la tienda y en la base queda su ruta, p. ej. /fotos-prueba/xxx.webp:
    python cargar_fotos_prueba.py --guardar-en ../web/public/fotos-prueba --url-base /fotos-prueba

Requiere BLOB_READ_WRITE_TOKEN en el entorno (el mismo que usa el backend),
salvo con --vista-previa o --simular.
"""
import argparse
import colorsys
import hashlib
import math
import os
import unicodedata
import uuid
from io import BytesIO

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from sqlalchemy.exc import OperationalError

from app import create_app
from app.extensions import db
from app.models import ImagenProducto, Producto

ANCHO, ALTO = 1200, 1500  # 4:5, la proporción de las fotos en la tienda
SS = 2  # se dibuja al doble y se reduce: bordes suaves sin depender de antialias
CARPETA_BLOB = "uploads/productos/prueba"
VISTAS = ("frente", "lado", "detalle", "ambiente")

COLORES_POR_NOMBRE = {
    "negro": "#1f1d22", "blanco": "#f4f2ee", "beige": "#d9c4a3", "crema": "#efe3c8",
    "marron": "#7a4b2a", "cafe": "#6b4228", "camel": "#b5834f", "vino": "#6e1f33",
    "rojo": "#b8232f", "rosa": "#e59ab3", "fucsia": "#c81d77", "morado": "#6c3a8c",
    "lila": "#b59ad6", "azul": "#2b4f8c", "celeste": "#8ec3e6", "verde": "#3f7a4e",
    "amarillo": "#e8c547", "naranja": "#e07a2e", "gris": "#8a8890", "plateado": "#c5c8cf",
    "dorado": "#c9a44c", "nude": "#d8b49c", "mostaza": "#c99a2e", "turquesa": "#2aa39b",
}


# ---------- utilidades de color ----------

def _sin_tildes(texto):
    texto = unicodedata.normalize("NFD", (texto or "").lower())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def _hex_a_rgb(valor):
    valor = (valor or "").strip().lstrip("#")
    if len(valor) == 3:
        valor = "".join(c * 2 for c in valor)
    if len(valor) != 6:
        return None
    try:
        return tuple(int(valor[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None


def color_de(nombre, codigo_hex, semilla):
    rgb = _hex_a_rgb(codigo_hex)
    if rgb:
        return rgb
    clave = _sin_tildes(nombre)
    for palabra, valor in COLORES_POR_NOMBRE.items():
        if palabra in clave:
            return _hex_a_rgb(valor)
    # Sin color conocido: un tono estable a partir del nombre del producto.
    h = int(hashlib.md5(semilla.encode()).hexdigest()[:6], 16) / 0xFFFFFF
    r, g, b = colorsys.hls_to_rgb(h, 0.45, 0.45)
    return int(r * 255), int(g * 255), int(b * 255)


def _mezclar(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _oscuro(c, t=0.35):
    return _mezclar(c, (0, 0, 0), t)


def _claro(c, t=0.35):
    return _mezclar(c, (255, 255, 255), t)


def _luminancia(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


# ---------- tipo de producto ----------

def tipo_de(producto):
    nombre = _sin_tildes(producto.nombre)
    categoria = _sin_tildes(producto.categoria.slug if producto.categoria else "")
    if "mochila" in nombre or "mochila" in categoria:
        return "mochila"
    if any(p in nombre for p in ("sandalia", "chancla", "ojota")):
        return "sandalia"
    if any(p in nombre for p in ("botin", "bota")):
        return "botin"
    if "pantufla" in nombre:
        return "pantufla"
    if any(p in nombre for p in ("zapat", "mocasin", "balerina", "tenis")) or "calzado" in categoria:
        return "zapato"
    if any(p in nombre for p in ("lente", "gafa")):
        return "lentes"
    if any(p in nombre for p in ("correa", "cinturon")):
        return "correa"
    if any(p in nombre for p in ("collar", "arete", "pulsera", "aret")):
        return "collar"
    if any(p in nombre for p in ("billetera", "monedero")) or "accesorio" in categoria:
        return "billetera"
    return "bolso"


# ---------- dibujo de cada tipo (coordenadas en unidades u = ancho/10) ----------

def _rr(d, caja, radio, relleno, borde=None, grosor=0):
    d.rounded_rectangle(caja, radius=radio, fill=relleno, outline=borde, width=grosor)


def dibujar_bolso(d, cx, cy, u, c):
    o, cl = _oscuro(c), _claro(c, 0.25)
    # asa
    d.arc((cx - 2.1 * u, cy - 4.3 * u, cx + 2.1 * u, cy - 0.3 * u), 180, 360, fill=o, width=int(0.42 * u))
    # cuerpo (trapecio redondeado)
    cuerpo = [(cx - 3.4 * u, cy + 2.6 * u), (cx - 2.8 * u, cy - 1.9 * u),
              (cx + 2.8 * u, cy - 1.9 * u), (cx + 3.4 * u, cy + 2.6 * u)]
    d.polygon(cuerpo, fill=c)
    _rr(d, (cx - 3.45 * u, cy + 1.9 * u, cx + 3.45 * u, cy + 2.75 * u), int(0.4 * u), c)
    # solapa y brillo
    d.polygon([(cx - 2.8 * u, cy - 1.9 * u), (cx + 2.8 * u, cy - 1.9 * u),
               (cx + 2.5 * u, cy - 0.2 * u), (cx - 2.5 * u, cy - 0.2 * u)], fill=_oscuro(c, 0.12))
    d.line([(cx - 2.5 * u, cy - 0.2 * u), (cx + 2.5 * u, cy - 0.2 * u)], fill=o, width=int(0.08 * u))
    d.polygon([(cx - 2.6 * u, cy + 0.2 * u), (cx - 2.2 * u, cy + 0.2 * u),
               (cx - 2.6 * u, cy + 2.2 * u), (cx - 3.0 * u, cy + 2.2 * u)], fill=cl)
    # broche
    d.ellipse((cx - 0.35 * u, cy - 0.55 * u, cx + 0.35 * u, cy + 0.15 * u), fill=(201, 164, 76), outline=(150, 118, 48), width=int(0.06 * u))


def dibujar_mochila(d, cx, cy, u, c):
    o = _oscuro(c)
    d.arc((cx - 0.9 * u, cy - 4.6 * u, cx + 0.9 * u, cy - 2.8 * u), 180, 360, fill=o, width=int(0.3 * u))
    _rr(d, (cx - 3.4 * u, cy - 1.2 * u, cx - 2.6 * u, cy + 3.0 * u), int(0.4 * u), o)
    _rr(d, (cx + 2.6 * u, cy - 1.2 * u, cx + 3.4 * u, cy + 3.0 * u), int(0.4 * u), o)
    _rr(d, (cx - 2.8 * u, cy - 3.7 * u, cx + 2.8 * u, cy + 3.4 * u), int(1.6 * u), c)
    d.arc((cx - 2.4 * u, cy - 3.4 * u, cx + 2.4 * u, cy + 0.6 * u), 200, 340, fill=o, width=int(0.09 * u))
    _rr(d, (cx - 2.0 * u, cy + 0.4 * u, cx + 2.0 * u, cy + 2.9 * u), int(0.7 * u), _oscuro(c, 0.12), o, int(0.07 * u))
    d.line([(cx - 1.6 * u, cy + 0.9 * u), (cx + 1.6 * u, cy + 0.9 * u)], fill=o, width=int(0.08 * u))
    d.rectangle((cx + 1.1 * u, cy + 0.85 * u, cx + 1.3 * u, cy + 1.4 * u), fill=(201, 164, 76))
    d.ellipse((cx - 2.3 * u, cy - 2.8 * u, cx - 1.5 * u, cy - 1.0 * u), fill=_claro(c, 0.25))


def _suela(d, cx, cy, u, c, alto=0.45):
    d.rounded_rectangle((cx - 4.0 * u, cy + 1.6 * u, cx + 4.0 * u, cy + (1.6 + alto) * u), radius=int(0.25 * u), fill=c)


def dibujar_zapato(d, cx, cy, u, c):
    o = _oscuro(c)
    _suela(d, cx, cy, u, _claro(c, 0.65) if _luminancia(c) < 200 else (90, 80, 76))
    d.polygon([(cx - 3.9 * u, cy + 1.7 * u), (cx - 3.7 * u, cy - 0.6 * u), (cx - 2.4 * u, cy - 1.2 * u),
               (cx - 0.6 * u, cy - 0.5 * u), (cx + 1.6 * u, cy + 0.2 * u), (cx + 3.6 * u, cy + 0.6 * u),
               (cx + 4.0 * u, cy + 1.7 * u)], fill=c)
    d.ellipse((cx - 2.9 * u, cy - 1.0 * u, cx - 0.8 * u, cy - 0.1 * u), fill=o)
    for i in range(3):
        x = cx - 0.6 * u + i * 0.55 * u
        d.line([(x, cy - 0.35 * u + i * 0.15 * u), (x + 0.35 * u, cy - 0.05 * u + i * 0.15 * u)], fill=_claro(c, 0.6), width=int(0.1 * u))
    d.line([(cx - 3.8 * u, cy + 1.1 * u), (cx + 3.9 * u, cy + 1.1 * u)], fill=o, width=int(0.07 * u))


def dibujar_botin(d, cx, cy, u, c):
    o = _oscuro(c)
    _suela(d, cx, cy, u, (60, 52, 48), 0.55)
    d.polygon([(cx - 3.9 * u, cy + 1.7 * u), (cx - 3.6 * u, cy - 3.6 * u), (cx - 1.0 * u, cy - 3.6 * u),
               (cx - 0.7 * u, cy - 0.6 * u), (cx + 1.8 * u, cy + 0.1 * u), (cx + 3.7 * u, cy + 0.6 * u),
               (cx + 4.0 * u, cy + 1.7 * u)], fill=c)
    d.line([(cx - 1.0 * u, cy - 3.5 * u), (cx - 0.8 * u, cy - 0.7 * u)], fill=o, width=int(0.12 * u))
    d.rectangle((cx - 3.9 * u, cy + 1.7 * u, cx - 2.6 * u, cy + 2.6 * u), fill=(60, 52, 48))
    d.polygon([(cx - 3.3 * u, cy - 3.2 * u), (cx - 2.9 * u, cy - 3.2 * u), (cx - 3.1 * u, cy + 0.8 * u), (cx - 3.5 * u, cy + 0.8 * u)], fill=_claro(c, 0.2))


def dibujar_sandalia(d, cx, cy, u, c):
    _suela(d, cx, cy, u, _oscuro(c, 0.15), 0.9)
    d.rounded_rectangle((cx - 4.0 * u, cy + 1.3 * u, cx + 4.0 * u, cy + 1.75 * u), radius=int(0.2 * u), fill=_claro(c, 0.4))
    for x0 in (-2.9, -0.4, 1.9):
        d.arc((cx + (x0 - 0.9) * u, cy - 0.6 * u, cx + (x0 + 0.9) * u, cy + 2.8 * u), 190, 350, fill=c, width=int(0.42 * u))
    for i in range(7):
        x = cx - 1.2 * u + i * 0.4 * u
        d.ellipse((x - 0.1 * u, cy - 0.15 * u, x + 0.1 * u, cy + 0.05 * u), fill=(235, 235, 240))


def dibujar_pantufla(d, cx, cy, u, c):
    o = _oscuro(c, 0.2)
    _suela(d, cx, cy, u, (240, 236, 230), 0.5)
    d.chord((cx - 3.9 * u, cy - 1.6 * u, cx + 4.1 * u, cy + 3.6 * u), 180, 360, fill=c)
    d.ellipse((cx + 0.6 * u, cy - 1.6 * u, cx + 2.6 * u, cy + 0.5 * u), fill=_claro(c, 0.3))
    for dx in (0.95, 1.85):
        d.ellipse((cx + dx * u - 0.18 * u, cy - 0.9 * u, cx + dx * u + 0.18 * u, cy - 0.55 * u), fill=(30, 28, 32))
    d.polygon([(cx + 1.25 * u, cy - 0.4 * u), (cx + 1.55 * u, cy - 0.4 * u), (cx + 1.4 * u, cy - 0.1 * u)], fill=(232, 160, 60))
    d.ellipse((cx - 3.2 * u, cy - 0.4 * u, cx - 1.6 * u, cy + 0.6 * u), fill=o)


def dibujar_billetera(d, cx, cy, u, c):
    o = _oscuro(c)
    _rr(d, (cx - 3.6 * u, cy - 1.9 * u, cx + 3.6 * u, cy + 2.1 * u), int(0.5 * u), c)
    d.polygon([(cx - 3.6 * u, cy - 1.4 * u), (cx + 3.6 * u, cy - 1.4 * u), (cx + 3.6 * u, cy + 0.2 * u),
               (cx + 0.6 * u, cy + 0.6 * u), (cx - 3.6 * u, cy + 0.6 * u)], fill=_oscuro(c, 0.12))
    d.ellipse((cx + 2.3 * u, cy - 0.2 * u, cx + 2.9 * u, cy + 0.4 * u), fill=(201, 164, 76))
    d.line([(cx - 3.3 * u, cy + 1.7 * u), (cx + 3.3 * u, cy + 1.7 * u)], fill=o, width=int(0.06 * u))


def dibujar_lentes(d, cx, cy, u, c):
    o = _oscuro(c, 0.5)
    for lado in (-1, 1):
        x = cx + lado * 1.9 * u
        d.ellipse((x - 1.6 * u, cy - 1.3 * u, x + 1.6 * u, cy + 1.3 * u), fill=_mezclar(c, (40, 40, 46), 0.55), outline=c, width=int(0.28 * u))
        d.ellipse((x - 0.9 * u, cy - 0.8 * u, x - 0.3 * u, cy - 0.3 * u), fill=(255, 255, 255, 90))
    d.arc((cx - 0.5 * u, cy - 0.9 * u, cx + 0.5 * u, cy + 0.1 * u), 200, 340, fill=c, width=int(0.22 * u))
    d.line([(cx - 3.5 * u, cy - 0.6 * u), (cx - 4.3 * u, cy - 0.9 * u)], fill=o, width=int(0.2 * u))
    d.line([(cx + 3.5 * u, cy - 0.6 * u), (cx + 4.3 * u, cy - 0.9 * u)], fill=o, width=int(0.2 * u))


def dibujar_correa(d, cx, cy, u, c):
    o = _oscuro(c)
    d.arc((cx - 3.8 * u, cy - 2.6 * u, cx + 3.8 * u, cy + 3.0 * u), 0, 360, fill=c, width=int(0.9 * u))
    for i in range(5):
        a = math.radians(200 + i * 18)
        x, y = cx + 3.35 * u * math.cos(a), cy + 0.2 * u + 2.35 * u * math.sin(a)
        d.ellipse((x - 0.1 * u, y - 0.1 * u, x + 0.1 * u, y + 0.1 * u), fill=o)
    d.rounded_rectangle((cx + 2.7 * u, cy - 0.5 * u, cx + 4.4 * u, cy + 1.0 * u), radius=int(0.2 * u), outline=(201, 164, 76), width=int(0.25 * u))


def dibujar_collar(d, cx, cy, u, c):
    d.arc((cx - 3.0 * u, cy - 4.0 * u, cx + 3.0 * u, cy + 1.4 * u), 20, 160, fill=(201, 164, 76), width=int(0.12 * u))
    d.polygon([(cx, cy + 1.2 * u), (cx - 0.9 * u, cy + 2.3 * u), (cx, cy + 3.6 * u), (cx + 0.9 * u, cy + 2.3 * u)], fill=c, outline=(201, 164, 76))
    d.ellipse((cx - 0.3 * u, cy + 1.9 * u, cx + 0.05 * u, cy + 2.3 * u), fill=_claro(c, 0.6))


DIBUJOS = {
    "bolso": dibujar_bolso, "mochila": dibujar_mochila, "zapato": dibujar_zapato,
    "botin": dibujar_botin, "sandalia": dibujar_sandalia, "pantufla": dibujar_pantufla,
    "billetera": dibujar_billetera, "lentes": dibujar_lentes, "correa": dibujar_correa,
    "collar": dibujar_collar,
}


# ---------- composición de una foto ----------

def _fuente(tamano):
    for nombre in ("arialbd.ttf", "DejaVuSans-Bold.ttf", "Arial Bold.ttf"):
        try:
            return ImageFont.truetype(nombre, tamano)
        except OSError:
            continue
    return ImageFont.load_default()


def _fondo(w, h, arriba, abajo):
    franja = Image.new("RGB", (1, h))
    for y in range(h):
        franja.putpixel((0, y), _mezclar(arriba, abajo, y / (h - 1)))
    return franja.resize((w, h))


def dibujar_foto(tipo, color, vista, semilla):
    w, h = ANCHO * SS, ALTO * SS
    # Fondo de estudio: neutro claro con un toque del color del producto
    # (oscuro si el producto es muy claro, para que se lea).
    claro = _luminancia(color) > 205
    base = (226, 222, 228) if claro else (244, 241, 238)
    tinte = _mezclar(base, color, 0.10)
    if vista == "ambiente":
        tinte = _mezclar((233, 226, 216), color, 0.18)
    img = _fondo(w, h, _claro(tinte, 0.3), _oscuro(tinte, 0.06))

    u = w / 10
    escala = {"frente": 1.0, "lado": 0.92, "detalle": 1.75, "ambiente": 0.72}[vista]
    cy = {"frente": h * 0.52, "lado": h * 0.53, "detalle": h * 0.62, "ambiente": h * 0.50}[vista]

    if vista == "ambiente":
        mesa = ImageDraw.Draw(img)
        mesa.rectangle((0, int(cy + 2.2 * u * escala), w, h), fill=_oscuro(tinte, 0.16))

    # sombra
    sombra = Image.new("L", (w, h), 0)
    ImageDraw.Draw(sombra).ellipse((w / 2 - 3.9 * u * escala, cy + 2.2 * u * escala,
                                    w / 2 + 3.9 * u * escala, cy + 2.9 * u * escala), fill=110)
    sombra = sombra.filter(ImageFilter.GaussianBlur(0.25 * u))
    img.paste(Image.new("RGB", (w, h), _oscuro(tinte, 0.45)), (0, 0), sombra)

    capa = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    DIBUJOS[tipo](ImageDraw.Draw(capa), w / 2, cy, u * escala, color)
    if vista == "lado":
        capa = capa.transpose(Image.Transpose.FLIP_LEFT_RIGHT).rotate(-7, resample=Image.Resampling.BICUBIC, center=(w / 2, cy))
    img.paste(capa, (0, 0), capa)

    img = img.resize((ANCHO, ALTO), Image.Resampling.LANCZOS)

    # marca "Foto de prueba"
    d = ImageDraw.Draw(img)
    fuente = _fuente(30)
    texto = "FOTO DE PRUEBA"
    x0, y0, x1, y1 = d.textbbox((0, 0), texto, font=fuente)
    pad = 16
    caja = (36, ALTO - 36 - (y1 - y0) - 2 * pad, 36 + (x1 - x0) + 2 * pad, ALTO - 36)
    d.rounded_rectangle(caja, radius=14, fill=(34, 24, 38))
    d.text((caja[0] + pad - x0, caja[1] + pad - y0), texto, font=fuente, fill=(250, 246, 240))

    salida = BytesIO()
    img.save(salida, format="PNG")
    return salida.getvalue()


def dibujar_recorte(tipo, color):
    """El producto solo, sobre fondo TRANSPARENTE (PNG), para el carrusel de la portada.
    Imita una foto de producto sin fondo; no lleva marca ni sombra (la pone la tienda)."""
    lado = 1400 * SS
    capa = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    DIBUJOS[tipo](ImageDraw.Draw(capa), lado / 2, lado / 2, lado / 10, color)
    caja = capa.getbbox()
    if caja:
        capa = capa.crop(caja)
    capa = capa.resize((max(1, capa.width // SS), max(1, capa.height // SS)), Image.Resampling.LANCZOS)
    salida = BytesIO()
    capa.save(salida, format="PNG")
    return salida.getvalue()


# ---------- plan por producto ----------

def plan_de_fotos(producto):
    """Lista de (vista, nombre_color_o_None, rgb) con al menos 4 fotos."""
    colores = []
    vistos = set()
    for v in producto.variantes:
        if v.color_obj and v.color_id not in vistos:
            vistos.add(v.color_id)
            colores.append(v.color_obj)
    semilla = f"{producto.id}-{producto.nombre}"
    if not colores:
        rgb = color_de("", None, semilla)
        return [(vista, None, rgb) for vista in VISTAS]
    plan = []
    for i, col in enumerate(colores[:4]):
        rgb = color_de(col.nombre, getattr(col, "codigo_hex", None), semilla)
        vistas = VISTAS if len(colores) == 1 else (VISTAS[0], VISTAS[1 + i % 3])
        plan.extend((vista, col.nombre, rgb) for vista in vistas)
    principal = plan[0]
    while len(plan) < 4:
        plan.append((VISTAS[len(plan) % 4], principal[1], principal[2]))
    return plan


def _es_de_prueba(url):
    return f"/{CARPETA_BLOB}/" in (url or "") or "/fotos-prueba/" in (url or "")


def guardar_local(png, carpeta, url_base):
    """Versión local de subir(): la foto principal en WebP, en una carpeta servida por la tienda."""
    from app.utils.imagenes import generar_variantes

    nombre = f"{uuid.uuid4().hex}.webp"
    with open(os.path.join(carpeta, nombre), "wb") as f:
        f.write(generar_variantes(png)[""])
    return f"{url_base.rstrip('/')}/{nombre}"


def subir(png):
    from app.utils.imagenes import _subir, generar_variantes, ruta_variante

    variantes = generar_variantes(png)
    ruta = f"{CARPETA_BLOB}/{uuid.uuid4().hex}.webp"
    for sufijo in ("thumb", "med", "lg"):
        _subir(ruta_variante(ruta, sufijo), variantes[sufijo])
    return _subir(ruta, variantes[""])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--vista-previa", metavar="CARPETA", help="solo dibuja las fotos en esa carpeta (no sube ni guarda nada)")
    p.add_argument("--simular", action="store_true", help="lista los productos que tocaría y sale")
    p.add_argument("--reemplazar-prueba", action="store_true", help="rehace también los productos que solo tienen fotos de prueba")
    p.add_argument("--producto", type=int, help="solo este id de producto")
    p.add_argument("--guardar-en", metavar="CARPETA", help="base local: guarda las fotos en esta carpeta en vez de subirlas a Blob")
    p.add_argument("--url-base", default="/fotos-prueba", help="con --guardar-en: ruta pública de esa carpeta (por defecto /fotos-prueba)")
    args = p.parse_args()

    app = create_app()
    with app.app_context():
        consulta = Producto.query.filter_by(activo=True).order_by(Producto.id)
        if args.producto:
            consulta = consulta.filter(Producto.id == args.producto)
        pendientes = []
        for producto in consulta:
            urls = [img.url for img in producto.imagenes]
            if not urls or (args.reemplazar_prueba and all(_es_de_prueba(u) for u in urls)):
                pendientes.append(producto)

        if not pendientes:
            print("No hay productos activos sin fotos. Nada que hacer.")
            return
        print(f"{len(pendientes)} producto(s) sin fotos:")
        for producto in pendientes:
            plan = plan_de_fotos(producto)
            colores = sorted({c for _, c, _ in plan if c}) or ["(sin color)"]
            print(f"  #{producto.id} {producto.nombre} · {tipo_de(producto)} · {len(plan)} fotos · {', '.join(colores)}")
        if args.simular:
            return

        if args.vista_previa:
            os.makedirs(args.vista_previa, exist_ok=True)
            for producto in pendientes:
                for i, (vista, _, rgb) in enumerate(plan_de_fotos(producto)):
                    ruta = os.path.join(args.vista_previa, f"{producto.id:03d}_{i}_{vista}.png")
                    with open(ruta, "wb") as f:
                        f.write(dibujar_foto(tipo_de(producto), rgb, vista, producto.id))
            print(f"Listo: fotos dibujadas en {os.path.abspath(args.vista_previa)}")
            return

        if args.guardar_en:
            os.makedirs(args.guardar_en, exist_ok=True)
            publicar = lambda png: guardar_local(png, args.guardar_en, args.url_base)  # noqa: E731
        elif os.getenv("BLOB_READ_WRITE_TOKEN"):
            publicar = subir
        else:
            raise SystemExit("Falta BLOB_READ_WRITE_TOKEN en el entorno (el mismo del backend), o usa --guardar-en.")

        # Se arma todo lo necesario y se SUELTA la conexión antes de subir: las subidas
        # tardan y Neon corta las conexiones que quedan abiertas sin usarse.
        trabajos = [(p.id, p.nombre, tipo_de(p), plan_de_fotos(p)) for p in pendientes]
        db.session.commit()
        db.session.remove()

        hechos = 0
        for producto_id, nombre, tipo, plan in trabajos:
            nuevas = []
            for vista, color, rgb in plan:
                nuevas.append((publicar(dibujar_foto(tipo, rgb, vista, producto_id)), color))
            # Recién con todo subido se tocan las filas (conexión nueva, transacción
            # corta): si falla una subida, el producto queda como estaba.
            for intento in (1, 2):
                try:
                    ImagenProducto.query.filter_by(producto_id=producto_id).delete()
                    for orden, (url, color) in enumerate(nuevas):
                        img = ImagenProducto(producto_id=producto_id, url=url, orden=orden)
                        img.color = color
                        db.session.add(img)
                    db.session.commit()
                    break
                except OperationalError:
                    db.session.rollback()
                    db.session.remove()
                    if intento == 2:
                        raise
            db.session.remove()
            hechos += 1
            print(f"  OK #{producto_id} {nombre}: {len(nuevas)} fotos")

        from app.utils.cache import invalidar_cache_publico
        invalidar_cache_publico()
        print(f"Listo: {hechos} producto(s) con fotos de prueba. La tienda nueva las muestra en ~1 minuto.")


if __name__ == "__main__":
    main()
