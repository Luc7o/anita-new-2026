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
from io import BytesIO

from xhtml2pdf import pisa

# Paleta de marca (coincide con los colores berry/plum/plum-soft del frontend)
COLOR_BERRY = "#8B2C4C"
COLOR_PLUM = "#3E1F2B"
COLOR_PLUM_SOFT = "#6B4C57"
COLOR_FONDO_SUAVE = "#F6ECEF"

# CSS base para todo documento generado (boleta o reporte). Cada documento
# solo necesita definir su propio <body>; este bloque da tipografía, colores
# de marca y el layout que se repite en ambos casos.
#
# Nota: xhtml2pdf soporta un subconjunto de CSS (sin @bottom-center ni otras
# reglas de "paged media" de WeasyPrint) — el pie de página con el nombre de
# la tienda se agrega directamente en el HTML de cada documento en vez de
# por CSS.
_CSS_BASE = f"""
    @page {{
        size: A4;
        margin: 2cm 1.8cm;
    }}
    * {{ box-sizing: border-box; }}
    body {{
        font-family: "Helvetica", "Arial", sans-serif;
        color: #222;
        font-size: 10.5pt;
        line-height: 1.4;
    }}
    h1 {{
        color: {COLOR_BERRY};
        font-size: 18pt;
        margin: 0 0 4px 0;
    }}
    h2 {{
        color: {COLOR_PLUM};
        font-size: 13pt;
        margin: 18px 0 8px 0;
        border-bottom: 1.5px solid {COLOR_BERRY};
        padding-bottom: 4px;
    }}
    .subtitulo {{
        color: {COLOR_PLUM_SOFT};
        font-size: 10pt;
        margin: 0 0 20px 0;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
    }}
    th {{
        background: {COLOR_BERRY};
        color: white;
        text-align: left;
        padding: 6px 8px;
        font-size: 9.5pt;
    }}
    td {{
        padding: 6px 8px;
        border-bottom: 1px solid #e5d9dd;
        font-size: 9.5pt;
    }}
    tr:nth-child(even) td {{
        background: {COLOR_FONDO_SUAVE};
    }}
    .totales td {{
        border: none;
        font-size: 10.5pt;
    }}
    .totales .monto {{
        text-align: right;
        font-weight: bold;
    }}
    .total-final {{
        color: {COLOR_BERRY};
        font-size: 13pt;
        font-weight: bold;
    }}
    .caja {{
        background: {COLOR_FONDO_SUAVE};
        border-left: 4px solid {COLOR_BERRY};
        padding: 10px 14px;
        margin: 12px 0;
        font-size: 9.5pt;
        color: {COLOR_PLUM};
    }}
"""


def formatear_moneda(valor):
    """S/ 1234.5 -> 'S/ 1,234.50' — mismo formato en boletas y reportes."""
    return f"S/ {float(valor):,.2f}"


def generar_pdf(html_body, titulo="Documento"):
    """
    Envuelve `html_body` (el contenido específico de la boleta o el reporte,
    ya armado como HTML) con el CSS de marca y lo convierte a bytes de PDF.

    `html_body` NO debe incluir <html>/<head>/<body> — solo el contenido
    interno del documento (títulos, tablas, etc.).
    """
    html_completo = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{titulo}</title>
        <style>{_CSS_BASE}</style>
    </head>
    <body>
        {html_body}
        <p style="margin-top: 30px; text-align: center; font-size: 8pt; color: {COLOR_PLUM_SOFT};">
            Anita New Style
        </p>
    </body>
    </html>
    """
    buffer = BytesIO()
    resultado = pisa.CreatePDF(html_completo, dest=buffer)
    if resultado.err:
        raise RuntimeError(f"No se pudo generar el PDF ({resultado.err} errores de renderizado)")
    return buffer.getvalue()