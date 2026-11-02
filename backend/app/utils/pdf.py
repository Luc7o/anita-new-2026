"""
Generación de PDF compartida por boletas y reportes de venta.

Sigue el mismo patrón que utils/correo.py: una función utilitaria simple,
sin plantillas Jinja en disco — el HTML se arma con f-strings directamente
en el módulo que lo necesita (boletas.py, reportes.py) y este archivo solo
se encarga de envolverlo con el CSS de marca y convertirlo a PDF.

Usa xhtml2pdf (100% Python, basado en reportlab) en vez de WeasyPrint:
WeasyPrint necesita librerías del sistema (Pango, GObject, Cairo) que no
vienen instaladas en Windows por defecto y que tampoco están garantizadas
en el entorno serverless de Vercel — xhtml2pdf evita ese problema por
completo, a cambio de soportar un subconjunto más simple de CSS (nada de
flexbox/grid, pero de sobra para tablas, colores y bordes como los de acá).
"""
import base64
import hashlib
import os
import re
from io import BytesIO
from pathlib import Path

from flask import current_app, has_app_context

from xhtml2pdf import pisa
from xhtml2pdf.xhtml2pdf_reportlab import PmlImageReader

def _repr_por_contenido(self):
    try:
        return "PmlImageReader-" + hashlib.md5(self.getRGBData()).hexdigest()
    except Exception:
        return object.__repr__(self)


# Parche a xhtml2pdf: al dibujar una imagen, ReportLab la nombra con str() del
# PmlImageReader (que no hereda de ImageReader), y por defecto ese texto lleva
# la dirección de memoria del objeto. Esos lectores son temporales, así que
# Python reutiliza la misma dirección para imágenes distintas y ReportLab las
# toma por la misma: en la boleta las 4 esquinas redondeadas salían idénticas.
# Nombrarlas por el contenido evita la colisión (y no cambia nada si el logo
# u otra imagen ya se dibujaban bien).
PmlImageReader.__str__ = _repr_por_contenido



def formatear_moneda(valor):
    """S/ 1234.5 -> 'S/ 1,234.50' — mismo formato en boletas y reportes."""
    return f"S/ {float(valor):,.2f}"


MARCA_PRUEBA_PATH = Path(__file__).resolve().parent.parent / "static" / "marca-prueba.png"

TEXTO_AVISO_PRUEBA = (
    "DOCUMENTO DE PRUEBA &middot; pago simulado (Culqi en modo de prueba) &middot; "
    "no es real ni tiene valor comercial o tributario"
)
TEXTO_PIE_PRUEBA = "DOCUMENTO DE PRUEBA &middot; no es real, sin valor comercial ni tributario"


def es_modo_prueba():
    """
    True si el sistema está cobrando en modo de prueba.

    Se detecta solo: las llaves de prueba de Culqi empiezan con "sk_test". Cuando
    se pongan las llaves reales ("sk_live...") los PDF dejan de marcarse, sin
    tocar código. Para forzarlo a mano, define MODO_PRUEBA=1 (marcar) o
    MODO_PRUEBA=0 (no marcar).
    """
    manual = (os.getenv("MODO_PRUEBA") or "").strip().lower()
    if manual:
        return manual in ("1", "true", "si", "sí", "yes", "on")
    if has_app_context():
        return str(current_app.config.get("CULQI_SECRET_KEY") or "").startswith("sk_test")
    return False


def _marcar_como_prueba(html):
    """Agrega el aviso arriba, la marca de agua diagonal y una línea en el pie de cada página."""
    css = (
        ".aviso-prueba { border: 1.5px solid #a32d2d; background: #fde8e8; color: #7a1d1d; "
        "padding: 2px 6px; margin-bottom: 3px; text-align: center; font-size: 7pt; font-weight: bold; }"
        ".pie-prueba { text-align: center; color: #a32d2d; font-size: 7pt; font-weight: bold; }"
    )
    html = html.replace("</style>", css + "</style>", 1)
    try:
        b64 = base64.b64encode(MARCA_PRUEBA_PATH.read_bytes()).decode()
        # Se mete DENTRO de la regla @page que ya trae cada plantilla: una segunda regla
        # reemplazaría la plantilla de página y haría desaparecer el pie.
        html = html.replace("@page {", f"@page {{ background-image: url('data:image/png;base64,{b64}');", 1)
    except OSError:
        pass  # sin imagen de marca de agua igual queda el aviso y la línea del pie
    html = html.replace("<body>", f'<body><div class="aviso-prueba">{TEXTO_AVISO_PRUEBA}</div>', 1)
    html = html.replace(
        '<div id="pie_contenido">', f'<div id="pie_contenido"><p class="pie-prueba">{TEXTO_PIE_PRUEBA}</p>', 1
    )
    # El aviso de arriba ocupa lugar: se sube el contenido restándole ese alto al margen superior
    # de la página, así la boleta y los reportes no se corren de página.
    html = re.sub(
        r"(@page\s*\{[^}]*?margin:\s*)([\d.]+)cm",
        lambda m: f"{m.group(1)}{max(float(m.group(2)) - 0.45, 0.4):.2f}cm",
        html,
        count=1,
    )
    # La línea extra necesita más alto: se agranda el marco del pie (crece hacia arriba).
    html = re.sub(
        r"(@frame pie\s*\{[^}]*?height:\s*)([\d.]+)cm",
        lambda m: f"{m.group(1)}{float(m.group(2)) + 0.5:.2f}cm",
        html,
        count=1,
    )
    return html


def html_a_pdf(html_completo):
    """
    Convierte un documento HTML COMPLETO (con su propio <style>) a bytes de
    PDF. Lo usan la boleta y el reporte de ventas, cada uno con su propia
    plantilla.
    """
    if es_modo_prueba():
        html_completo = _marcar_como_prueba(html_completo)
    buffer = BytesIO()
    resultado = pisa.CreatePDF(html_completo, dest=buffer)
    if resultado.err:
        raise RuntimeError(f"No se pudo generar el PDF ({resultado.err} errores de renderizado)")
    return buffer.getvalue()