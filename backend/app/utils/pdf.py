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
import hashlib
from io import BytesIO

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


def html_a_pdf(html_completo):
    """
    Convierte un documento HTML COMPLETO (con su propio <style>) a bytes de
    PDF. Lo usan la boleta y el reporte de ventas, cada uno con su propia
    plantilla.
    """
    buffer = BytesIO()
    resultado = pisa.CreatePDF(html_completo, dest=buffer)
    if resultado.err:
        raise RuntimeError(f"No se pudo generar el PDF ({resultado.err} errores de renderizado)")
    return buffer.getvalue()