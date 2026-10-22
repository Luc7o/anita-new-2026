"""
Boleta compartida por el pedido online (backend/app/routes/pedidos.py) y por
la venta presencial (backend/app/routes/admin_pedidos.py) — un solo lugar
arma el HTML, así ambos flujos generan exactamente el mismo comprobante.

Diseño: cabecera con logo, datos de la tienda y recuadro redondeado con el
RUC / número de boleta; datos del cliente; fila de fecha, pedido y pago;
tabla de detalle (CANTIDAD / U.M. / DESCRIPCIÓN / PRECIO / IMPORTE) que
siempre ocupa el alto de la hoja; monto en letras, desglose de IGV y pie.

Igual que el reporte de ventas, NO usa el CSS de marca de generar_pdf(): trae
su propia plantilla sobria y se convierte con html_a_pdf().

Datos de la tienda que NO están en el pedido (se leen de variables de
entorno vía app/config.py; si alguno está vacío, su línea simplemente no se
imprime en la boleta):
  PROVEEDOR_RUC, PROVEEDOR_DOMICILIO, BOLETA_TELEFONO, BOLETA_EMAIL,
  BOLETA_POLITICA_CAMBIOS
"""
import base64
import io
from decimal import Decimal
from functools import lru_cache
from html import escape

from flask import Response, current_app, jsonify
from PIL import Image, ImageDraw

from app.utils.formato import a_2_decimales as _2d, a_lima, logo_html, num as _num
from app.utils.pdf import html_a_pdf

NOMBRE_TIENDA = "ANITA NEW STYLE"
WEB_TIENDA = "anita-new-2026.vercel.app"
IGV_TASA = Decimal("0.18")

# Lima no tiene horario de verano: siempre UTC-5 (offset fijo, sin depender
# de la base de datos tz del entorno serverless).
# Alto aproximado (en puntos) que debe ocupar la zona de detalle para que la
# boleta se vea como una hoja completa; el espacio que no usan las filas se
# rellena con una fila vacía (ver _bloque_items). Con muchos ítems la fila de
# relleno desaparece y la tabla simplemente continúa en la hoja siguiente.
_ALTO_ZONA_DETALLE = 392
_ALTO_FILA = 20           # fila de un ítem sin variante
_ALTO_FILA_VARIANTE = 31  # fila con la línea "Talla · Color"
_ALTO_LINEA_EXTRA = 11    # cada línea adicional si el nombre se parte en varias

_RADIO_ESQUINA = 12  # px (96 dpi) de las esquinas redondeadas

_CSS = """
    @page {
        size: A4;
        margin: 1.2cm 1.25cm 1.9cm 1.25cm;
        @frame pie {
            -pdf-frame-content: pie_contenido;
            left: 1.25cm; right: 1.25cm; bottom: 0.7cm; height: 0.9cm;
        }
    }
    body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 8.5pt; }
    p { margin: 0; }
    td, th { padding: 0; vertical-align: middle; }
    .gris { color: #777; }
    .der { text-align: right; }
    .centro { text-align: center; }

    table.cab { width: 100%; }
    .tienda { font-size: 16pt; font-weight: bold; text-align: center; }
    .dato { font-size: 8.5pt; text-align: center; margin-top: 3px; }

    table.rb { width: 100%; }
    table.rb td { border: none; padding: 0; }
    table.rb td.rb-t { border-top: 0.75pt solid #111; }
    table.rb td.rb-b { border-bottom: 0.75pt solid #111; }
    table.rb td.rb-l { border-left: 0.75pt solid #111; }
    table.rb td.rb-r { border-right: 0.75pt solid #111; }
    table.rb td.rb-c { font-size: 1px; line-height: 1px; }

    .ruc { font-size: 10.5pt; text-align: center; color: #555; padding-top: 12px; }
    .tipo { font-size: 12.5pt; font-weight: bold; text-align: center; padding-top: 9px; }
    .numero { font-size: 10pt; font-weight: bold; text-align: center; padding: 9px 0 14px 0; }

    table.cliente td { font-size: 8.5pt; padding: 2px 0; }
    table.cliente td.etq { font-weight: bold; width: 62px; }

    .obs-titulo { font-weight: bold; font-size: 8pt; margin-top: 10px; }
    .obs-texto { font-size: 8pt; margin-top: 2px; }

    table.meta { width: 100%; margin-top: 8px; border: 0.75pt solid #111; }
    table.meta td { padding: 6px 4px 7px 4px; text-align: center; font-size: 8.5pt; }
    table.meta td.sep { border-left: 0.75pt solid #111; }
    .meta-etq { font-weight: bold; font-size: 8pt; }
    .meta-val { margin-top: 3px; }

    table.items { width: 100%; }
    table.items th {
        background-color: #f4f4f4; font-size: 8pt; font-weight: bold; text-align: center;
        padding: 7px 4px; border-top: 0.75pt solid #111; border-bottom: 0.75pt solid #111;
        border-left: 0.75pt solid #111;
    }
    table.items th.ult { border-right: 0.75pt solid #111; }
    table.items td { font-size: 8.5pt; padding: 7px 8px 4px 8px; border-left: 0.75pt solid #111; border-top: none; border-bottom: none; vertical-align: top; }
    table.items td.ult { border-right: 0.75pt solid #111; }
    table.items td.fin { border-bottom: 0.75pt solid #111; }
    table.items td.c { text-align: center; }
    table.items td.r { text-align: right; }
    .variante { font-size: 7.5pt; color: #666; margin-top: 2px; }

    .son { font-weight: bold; font-size: 8.5pt; margin-top: 9px; }

    table.pie-datos { width: 100%; margin-top: 10px; }
    .gracias { font-weight: bold; font-size: 10.5pt; }
    .pie-txt { font-size: 8pt; margin-top: 7px; }

    table.totales { width: 100%; }
    table.totales td { font-size: 8.5pt; padding: 3px 0; }
    table.totales td.etq { font-weight: bold; text-align: right; padding-right: 22px; }
    table.totales td.monto { text-align: right; width: 70px; }
    table.totales td.tl { border-top: 0.75pt solid #111; padding-top: 6px; font-weight: bold; font-size: 10pt; }

    table.linea-pie { width: 100%; border-top: 0.5pt solid #bbb; }
    table.linea-pie td { font-size: 7.5pt; color: #555; padding-top: 6px; }
"""


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

_UNIDADES = [
    "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS",
    "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS",
    "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE",
    "VEINTIOCHO", "VEINTINUEVE",
]
_DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
_CENTENAS = [
    "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
    "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
]


def _menor_mil(n):
    """0 < n < 1000 en letras."""
    if n == 100:
        return "CIEN"
    texto = []
    c, resto = divmod(n, 100)
    if c:
        texto.append(_CENTENAS[c])
    if resto < 30:
        if resto:
            texto.append(_UNIDADES[resto])
    else:
        d, u = divmod(resto, 10)
        texto.append(_DECENAS[d] + (f" Y {_UNIDADES[u]}" if u else ""))
    return " ".join(texto)


def _entero_a_letras(n):
    """Entero 0 <= n < 1,000,000,000 en letras (mayúsculas, español)."""
    if n == 0:
        return "CERO"
    partes = []
    millones, resto = divmod(n, 1_000_000)
    miles, unidades = divmod(resto, 1000)
    if millones:
        partes.append("UN MILLÓN" if millones == 1 else f"{_menor_mil(millones)} MILLONES")
    if miles:
        if miles == 1:
            partes.append("MIL")
        else:
            letras = _menor_mil(miles)
            # "veintiuno mil" -> "veintiún mil", "treinta y uno mil" -> "treinta y un mil"
            if letras.endswith("VEINTIUNO"):
                letras = letras[:-9] + "VEINTIÚN"
            elif letras.endswith("UNO"):
                letras = letras[:-1]
            partes.append(f"{letras} MIL")
    if unidades:
        partes.append(_menor_mil(unidades))
    return " ".join(partes)


def monto_en_letras(total):
    """197.10 -> 'CIENTO NOVENTA Y SIETE CON 10/100 SOLES'."""
    centimos_totales = int((_2d(total) * 100).to_integral_value())
    soles, centimos = divmod(centimos_totales, 100)
    return f"{_entero_a_letras(soles)} CON {centimos:02d}/100 SOLES"


# ---------------------------------------------------------------------------
# Recuadros con esquinas redondeadas
#
# xhtml2pdf no soporta border-radius, así que cada recuadro es una tabla de
# 3x3: las 4 esquinas son imágenes de un cuarto de círculo y los lados son
# bordes normales de celda. Las esquinas se dibujan con fondo blanco OPACO a
# propósito: ver el parche de PmlImageReader en app/utils/pdf.py (sin él,
# imágenes distintas se confunden entre sí al armar el PDF).
# ---------------------------------------------------------------------------

@lru_cache(maxsize=4)
def _esquina_uri(posicion):
    r, grosor = 48, 4  # se dibuja a 4x y se reduce al mostrarla (nítida al imprimir)
    grande = Image.new("RGB", (2 * r, 2 * r), (255, 255, 255))
    ImageDraw.Draw(grande).ellipse((0, 0, 2 * r - 1, 2 * r - 1), outline=(17, 17, 17), width=grosor)
    caja = {
        "tl": (0, 0, r, r),
        "tr": (r, 0, 2 * r, r),
        "bl": (0, r, r, 2 * r),
        "br": (r, r, 2 * r, 2 * r),
    }[posicion]
    buf = io.BytesIO()
    grande.crop(caja).save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _esquina(posicion):
    r = _RADIO_ESQUINA
    return (
        f'<td class="rb-c" style="width: {r}px; height: {r}px;">'
        f'<img src="{_esquina_uri(posicion)}" width="{r}" height="{r}" /></td>'
    )


def _recuadro(contenido):
    """Envuelve `contenido` (HTML) en un recuadro de bordes redondeados."""
    r = _RADIO_ESQUINA
    return f"""
    <table class="rb">
        <tr>{_esquina("tl")}<td class="rb-t"></td>{_esquina("tr")}</tr>
        <tr><td class="rb-l" style="width: {r}px;"></td><td>{contenido}</td><td class="rb-r" style="width: {r}px;"></td></tr>
        <tr>{_esquina("bl")}<td class="rb-b"></td>{_esquina("br")}</tr>
    </table>
    """


# ---------------------------------------------------------------------------
# Piezas de la boleta
# ---------------------------------------------------------------------------

def _datos_tienda():
    cfg = current_app.config
    return {
        "ruc": (cfg.get("PROVEEDOR_RUC") or "").strip(),
        "direccion": (cfg.get("PROVEEDOR_DOMICILIO") or "").strip(),
        "telefono": (cfg.get("BOLETA_TELEFONO") or "").strip(),
        "email": (cfg.get("BOLETA_EMAIL") or "").strip(),
        "politica": (cfg.get("BOLETA_POLITICA_CAMBIOS") or "").strip(),
    }


def _alto_fila(detalle):
    tiene_variante = bool(detalle.get("talla") or detalle.get("color"))
    alto = _ALTO_FILA_VARIANTE if tiene_variante else _ALTO_FILA
    # ~55 caracteres caben en la columna de descripción antes de partirse.
    nombre = detalle.get("producto_nombre") or ""
    return alto + _ALTO_LINEA_EXTRA * (max(len(nombre) - 1, 0) // 55)


def _clases(indice, alineacion="", fin=False):
    """Clases de una celda del detalle: alineación, borde derecho (última
    columna) y borde inferior (última fila). Ver el CSS de table.items."""
    clases = [c for c in (alineacion, "ult" if indice == 4 else "", "fin" if fin else "") if c]
    return f' class="{" ".join(clases)}"' if clases else ""


def _fila_detalle(detalle, fin=False):
    etiquetas = []
    if detalle.get("talla"):
        etiquetas.append(f"Talla {escape(str(detalle['talla']))}")
    if detalle.get("color"):
        etiquetas.append(f"Color {escape(str(detalle['color']))}")
    variante = f'<p class="variante">{" &middot; ".join(etiquetas)}</p>' if etiquetas else ""

    nombre = escape((detalle.get("producto_nombre") or "Producto no disponible").upper())

    return f"""
    <tr>
        <td{_clases(0, "c", fin)}>{int(detalle['cantidad'])}</td>
        <td{_clases(1, "c", fin)}>UNIDAD</td>
        <td{_clases(2, "", fin)}><p>{nombre}</p>{variante}</td>
        <td{_clases(3, "r", fin)}>{_num(detalle['precio_unit'])}</td>
        <td{_clases(4, "r", fin)}>{_num(detalle['subtotal'])}</td>
    </tr>
    """


def _bloque_cabecera(data, tienda):
    lineas = []
    if tienda["direccion"]:
        lineas.append(f'<p class="dato gris">{escape(tienda["direccion"])}</p>')
    if tienda["telefono"]:
        lineas.append(f'<p class="dato"><b>Telf:</b> {escape(tienda["telefono"])}</p>')
    if tienda["email"]:
        lineas.append(f'<p class="dato"><b>Email:</b> {escape(tienda["email"])}</p>')
    lineas.append(f'<p class="dato"><b>Web:</b> {WEB_TIENDA}</p>')

    ruc = f'<p class="ruc">R.U.C. {escape(tienda["ruc"])}</p>' if tienda["ruc"] else '<p style="padding-top: 6px;"></p>'
    caja_tipo = _recuadro(
        f"""
        {ruc}
        <p class="tipo">BOLETA DE VENTA</p>
        <p class="numero">N&deg; {escape(data['numero_pedido'])}</p>
        """
    )

    return f"""
    <table class="cab"><tr>
        <td style="width: 146px;">{logo_html(132)}</td>
        <td style="padding: 0 6px;">
            <p class="tienda">{NOMBRE_TIENDA}</p>
            {"".join(lineas)}
        </td>
        <td style="width: 190px;">{caja_tipo}</td>
    </tr></table>
    """


def _bloque_cliente(data):
    nombre = escape(data.get("envio_nombre") or "Cliente mostrador")
    telefono = escape(data.get("envio_telefono") or "—")
    doc = (data.get("envio_numero_documento") or "").strip()
    etiqueta_doc = escape((data.get("envio_tipo_documento") or "DNI").upper())
    fila_doc = (
        f'<tr><td class="etq">{etiqueta_doc}</td><td>: {escape(doc)}</td></tr>' if doc else ""
    )
    return _recuadro(
        f"""
        <table class="cliente">
            <tr><td class="etq">Cliente</td><td>: {nombre}</td></tr>
            {fila_doc}
            <tr><td class="etq">Teléfono</td><td>: {telefono}</td></tr>
        </table>
        """
    )


def _bloque_observaciones(data):
    nota = (data.get("nota") or "").strip()
    texto = f'<p class="obs-texto">{escape(nota)}</p>' if nota else ""
    return f'<p class="obs-titulo">Observaciones</p>{texto}'


def _bloque_meta(data):
    fecha = a_lima(data["fecha_creacion"]).strftime("%d/%m/%Y")
    # Venta presencial en efectivo: el modelo la guarda como "efectivo" con
    # origen "presencial" (el label genérico diría "Pago contra entrega").
    if data["metodo_pago"] == "efectivo" and data["origen"] == "presencial":
        medio = "EFECTIVO"
    else:
        medio = (data["metodo_pago_label"] or "").upper()

    def celda(etiqueta, valor, sep=True):
        clase = ' class="sep"' if sep else ""
        return (
            f'<td{clase}><p class="meta-etq">{etiqueta}</p>'
            f'<p class="meta-val">{escape(valor)}</p></td>'
        )

    return f"""
    <table class="meta"><tr>
        {celda("FECHA EMISIÓN", fecha, sep=False)}
        {celda("PEDIDO", data["numero_pedido"])}
        {celda("COND. DE PAGO", "CONTADO")}
        {celda("MEDIO DE PAGO", medio)}
    </tr></table>
    """


def _bloque_items(detalles, reserva=0):
    """`reserva`: puntos que se le quitan a la zona de detalle porque el pie
    de la boleta creció (política de cambios de varias líneas)."""
    usado = sum(_alto_fila(d) for d in detalles)
    relleno = max(_ALTO_ZONA_DETALLE - reserva - usado, 0)
    # Si no hay fila de relleno, la última fila de ítem cierra el marco.
    filas = "".join(
        _fila_detalle(d, fin=(not relleno and i == len(detalles) - 1))
        for i, d in enumerate(detalles)
    )
    # Fila vacía que estira la tabla hasta el alto de la hoja; sus celdas
    # mantienen los bordes verticales de cada columna.
    fila_relleno = (
        f'<tr><td{_clases(0, "", True)} style="height: {relleno}pt; padding: 0;"></td>'
        + "".join(f'<td{_clases(i, "", True)} style="padding: 0;"></td>' for i in range(1, 5))
        + "</tr>"
        if relleno
        else ""
    )

    return f"""
    <table class="items">
        <tr>
            <th style="width: 68px;">CANTIDAD</th>
            <th style="width: 60px;">U.M.</th>
            <th>DESCRIPCIÓN</th>
            <th style="width: 84px;">PRECIO UNIT.<br />(S/)</th>
            <th class="ult" style="width: 92px;">IMPORTE (S/)<br />(Inc. IGV)</th>
        </tr>
        {filas}
        {fila_relleno}
    </table>
    """


def _bloque_totales(data):
    # Los precios de producto ya incluyen IGV: se desglosa hacia atrás.
    total_productos = _2d(data["subtotal"])
    op_gravada = _2d(total_productos / (1 + IGV_TASA))
    igv = total_productos - op_gravada

    return f"""
    <table class="totales">
        <tr><td class="etq">OP. GRAVADA (S/)</td><td class="monto">{_num(op_gravada)}</td></tr>
        <tr><td class="etq">IGV 18% (S/)</td><td class="monto">{_num(igv)}</td></tr>
        <tr><td class="etq">ENVÍO (S/)</td><td class="monto">{_num(data['costo_envio'])}</td></tr>
        <tr><td class="etq tl">IMPORTE TOTAL (S/)</td><td class="monto tl">{_num(data['total'])}</td></tr>
    </table>
    """


def generar_pdf_boleta(pedido):
    """
    Recibe una instancia de Pedido (con estado_pago='verificado') y devuelve
    los bytes del PDF de su boleta. Funciona igual para un pedido que vino
    del checkout online que para una venta presencial — ambos comparten el
    mismo modelo Pedido y el mismo to_dict().
    """
    data = pedido.to_dict(con_detalles=True)
    tienda = _datos_tienda()
    numero = escape(data["numero_pedido"])

    politica = (
        f'<p class="pie-txt"><b>Cambios y devoluciones:</b> {escape(tienda["politica"])}</p>'
        if tienda["politica"]
        else ""
    )

    # La política ocupa ~1 línea cada 85 caracteres; la primera ya cabe en el
    # espacio de reserva del pie, así que solo las siguientes restan alto.
    reserva = 10 * (len(tienda["politica"]) // 85)

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Boleta {numero}</title>
<style>{_CSS}</style></head>
<body>
    {_bloque_cabecera(data, tienda)}

    <div style="margin-top: 14px;">{_bloque_cliente(data)}</div>

    {_bloque_observaciones(data)}

    {_bloque_meta(data)}
    {_bloque_items(data["detalles"], reserva)}

    <p class="son">SON: {monto_en_letras(data['total'])}</p>

    <table class="pie-datos"><tr>
        <td style="vertical-align: top; width: 58%; padding-right: 12px;">
            <p class="gracias">¡Gracias por tu compra!</p>
            {politica}
            <p class="pie-txt" style="color: #444;">Conserva este comprobante para cualquier consulta o reclamo sobre tu pedido.</p>
        </td>
        <td style="vertical-align: top;">{_bloque_totales(data)}</td>
    </tr></table>

    <div id="pie_contenido">
        <table class="linea-pie"><tr>
            <td>{NOMBRE_TIENDA.title()} &middot; Comprobante de venta del pedido {numero}</td>
            <td class="der">{WEB_TIENDA}</td>
        </tr></table>
    </div>
</body></html>"""

    return html_a_pdf(html)


def responder_boleta(pedido):
    """Respuesta HTTP con la boleta en PDF (la usan la ruta del cliente y la del admin)."""
    if pedido.estado_pago != "verificado":
        return jsonify({"error": "Este pedido todavía no tiene el pago verificado"}), 400

    return Response(
        generar_pdf_boleta(pedido),
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename=boleta-{pedido.numero_pedido}.pdf"},
    )
