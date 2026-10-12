"""
Reporte de ventas en PDF para el dashboard de administrador.

Sigue la plantilla "EJEMPLO-reporte-ventas.pdf": cabecera con logo y recuadro
del título, KPIs, desglose de IGV, tablas por método de pago / origen /
producto / día, detalle de pedidos y pie con numeración de páginas.

A diferencia de la boleta, NO usa el CSS de marca de generar_pdf(): esta
plantilla es sobria (blanco y negro), así que trae su propio CSS y se
convierte con html_a_pdf(). La boleta y la hoja de reclamación no cambian.
"""
import base64
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from html import escape
from pathlib import Path

from app.utils.pdf import html_a_pdf, formatear_moneda

NOMBRE_TIENDA = "ANITA NEW STYLE"
WEB_TIENDA = "anita-new-2026.vercel.app"
IGV_TASA = 0.18

# Lima no tiene horario de verano: siempre UTC-5. Se usa un offset fijo en vez
# de zoneinfo para no depender de la base de datos tz del entorno serverless.
OFFSET_LIMA = timedelta(hours=-5)

_LOGO_PATH = Path(__file__).resolve().parent.parent / "static" / "logo-reporte.png"

_CSS = """
    @page {
        size: A4;
        margin: 1.4cm 1.6cm 2cm 1.6cm;
        @frame pie {
            -pdf-frame-content: pie_contenido;
            left: 1.6cm; right: 1.6cm; bottom: 0.9cm; height: 0.8cm;
        }
    }
    body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 9pt; }
    p { margin: 0; }
    .gris { color: #555; }
    .der { text-align: right; }
    .centro { text-align: center; }

    table.cab { width: 100%; border-collapse: collapse; }
    table.cab td { border: none; padding: 0; vertical-align: middle; }
    .tienda { font-size: 15pt; font-weight: bold; text-align: center; }
    .web { font-size: 8pt; text-align: center; margin-top: 4px; }
    table.caja-titulo { width: 100%; border: 1px solid #111; border-collapse: collapse; }
    table.caja-titulo td { padding: 8px 6px 4px 6px; text-align: center; border: none; }
    .caja-titulo .t { font-size: 11pt; font-weight: bold; }
    .caja-titulo .r { font-size: 7.5pt; padding-top: 2px; }

    table.meta { width: 100%; margin-top: 14px; font-size: 8pt; color: #333; }
    table.meta td { border: none; padding: 0; }

    table.kpis { width: 100%; border-collapse: separate; margin-top: 8px; }
    table.kpis td { border: 1px solid #111; padding: 10px 6px; text-align: center; width: 25%; }
    .kpi-valor { font-size: 13pt; font-weight: bold; }
    .kpi-etq { font-size: 7.5pt; color: #444; margin-top: 3px; }

    table.igv { width: 100%; margin-top: 10px; }
    table.igv td { border: none; padding: 4px 2px; font-size: 9pt; }
    table.igv td.monto { text-align: right; }
    table.igv td.tl { border-top: 1px solid #111; font-weight: bold; font-size: 10.5pt; padding-top: 5px; }

    h2 { font-size: 11pt; margin: 20px 0 6px 0; -pdf-keep-with-next: true; }

    table.datos { width: 100%; border-collapse: collapse; }
    table.datos th {
        text-align: left; font-size: 8pt; font-weight: bold;
        padding: 6px 4px; border-top: 1.5px solid #111; border-bottom: 1px solid #111;
    }
    table.datos td { padding: 6px 4px; font-size: 8.5pt; border-bottom: 0.5px solid #999; }
    table.datos .c { text-align: center; }
    table.datos .r { text-align: right; }
    table.detalle td { font-size: 7.5pt; }

    table.criterio { width: 100%; border: 1px solid #111; border-collapse: collapse; margin-top: 16px; }
    table.criterio td { padding: 7px 8px; font-size: 7.5pt; border: none; }

    table.pie { width: 100%; border-top: 0.5px solid #555; border-collapse: collapse; }
    table.pie td { padding-top: 4px; font-size: 7.5pt; color: #444; border: none; }
"""


def _logo_html():
    try:
        b64 = base64.b64encode(_LOGO_PATH.read_bytes()).decode()
        return f'<img src="data:image/png;base64,{b64}" width="80" height="80" />'
    except OSError:
        # Sin logo el reporte igual se genera: solo se deja el espacio vacío.
        return ""


def _a_lima(fecha_utc):
    """Los pedidos se guardan en UTC naive; el reporte los muestra en hora de Lima."""
    return fecha_utc + OFFSET_LIMA


def _metodo_label(p):
    if p.metodo_pago == "efectivo" and p.origen == "presencial":
        return "Efectivo (tienda)"
    return p.metodo_pago_label


def _metodo_corto(p):
    if p.metodo_pago == "tarjeta":
        return "Tarjeta"
    return _metodo_label(p)


def _pct(parte, total):
    return f"{(parte / total * 100) if total else 0:.1f}%"


def _num(valor):
    return f"{valor:,.2f}"


def _fila_vacia(cols):
    return f"<tr><td colspan='{cols}' class='c gris'>Sin ventas en este rango</td></tr>"


def generar_pdf_reporte_ventas(pedidos, desde_str=None, hasta_str=None):
    """
    Recibe una lista de Pedido (ya filtrados por quien llama: rango de
    fechas, solo ventas confirmadas) y arma el PDF con el resumen.
    """
    pedidos = list(pedidos)
    total_ventas = sum(float(p.total) for p in pedidos)
    total_envio = sum(float(p.costo_envio or 0) for p in pedidos)
    total_productos = sum(float(p.subtotal) for p in pedidos)  # ya incluye IGV
    n_pedidos = len(pedidos)

    op_gravada = total_productos / (1 + IGV_TASA)
    igv = total_productos - op_gravada

    pedidos_por_metodo = Counter()
    monto_por_metodo = defaultdict(float)
    pedidos_por_origen = Counter()
    monto_por_origen = defaultdict(float)
    pedidos_por_dia = Counter()
    monto_por_dia = defaultdict(float)
    unidades_por_producto = Counter()
    ingresos_por_producto = defaultdict(float)
    unidades_totales = 0

    for p in pedidos:
        metodo = _metodo_label(p)
        pedidos_por_metodo[metodo] += 1
        monto_por_metodo[metodo] += float(p.total)

        pedidos_por_origen[p.origen_label] += 1
        monto_por_origen[p.origen_label] += float(p.total)

        dia = _a_lima(p.fecha_creacion).date()
        pedidos_por_dia[dia] += 1
        monto_por_dia[dia] += float(p.total)

        for d in p.detalles:
            nombre = d.producto.nombre if d.producto else "Producto eliminado"
            unidades_por_producto[nombre] += d.cantidad
            ingresos_por_producto[nombre] += float(d.subtotal)
            unidades_totales += d.cantidad

    ticket_promedio = total_ventas / n_pedidos if n_pedidos else 0

    filas_metodo = "".join(
        f"<tr><td>{escape(m)}</td><td class='c'>{c}</td>"
        f"<td class='r'>{formatear_moneda(monto_por_metodo[m])}</td>"
        f"<td class='r'>{_pct(monto_por_metodo[m], total_ventas)}</td></tr>"
        for m, c in pedidos_por_metodo.most_common()
    ) or _fila_vacia(4)

    filas_origen = "".join(
        f"<tr><td>{escape(o)}</td><td class='c'>{c}</td>"
        f"<td class='r'>{formatear_moneda(monto_por_origen[o])}</td>"
        f"<td class='r'>{_pct(monto_por_origen[o], total_ventas)}</td></tr>"
        for o, c in pedidos_por_origen.most_common()
    ) or _fila_vacia(4)

    filas_productos = "".join(
        f"<tr><td>{i}</td><td>{escape(nombre)}</td><td class='c'>{unidades}</td>"
        f"<td class='r'>{formatear_moneda(ingresos_por_producto[nombre])}</td></tr>"
        for i, (nombre, unidades) in enumerate(unidades_por_producto.most_common(10), start=1)
    ) or _fila_vacia(4)

    filas_dias = "".join(
        f"<tr><td>{dia.strftime('%d/%m/%Y')}</td><td class='c'>{pedidos_por_dia[dia]}</td>"
        f"<td class='r'>{formatear_moneda(monto_por_dia[dia])}</td></tr>"
        for dia in sorted(pedidos_por_dia)
    ) or _fila_vacia(3)

    filas_pedidos = "".join(
        f"<tr><td>{escape(p.numero_pedido)}</td>"
        f"<td>{_a_lima(p.fecha_creacion).strftime('%d/%m/%Y')}</td>"
        f"<td>{escape(p.envio_nombre or ('Cliente mostrador' if p.origen == 'presencial' else '—'))}</td>"
        f"<td>{'Tienda' if p.origen == 'presencial' else 'Online'}</td>"
        f"<td>{escape(_metodo_corto(p))}</td>"
        f"<td class='r'>{formatear_moneda(p.total)}</td></tr>"
        for p in sorted(pedidos, key=lambda x: x.fecha_creacion)
    ) or _fila_vacia(6)

    rango = f"Del {desde_str or 'inicio'} al {hasta_str or 'hoy'}" if (desde_str or hasta_str) else "Todo el historial"
    emitido = _a_lima(datetime.utcnow()).strftime("%d/%m/%Y %H:%M")

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reporte de ventas — {rango}</title>
<style>{_CSS}</style></head>
<body>
    <table class="cab"><tr>
        <td style="width: 90px;">{_logo_html()}</td>
        <td>
            <p class="tienda">{NOMBRE_TIENDA}</p>
            <p class="web"><b>Web:</b> {WEB_TIENDA}</p>
        </td>
        <td style="width: 150px;">
            <table class="caja-titulo">
                <tr><td class="t">REPORTE DE<br />VENTAS</td></tr>
                <tr><td class="r" style="padding-bottom: 8px;">{rango}</td></tr>
            </table>
        </td>
    </tr></table>

    <table class="meta"><tr>
        <td>Emitido el {emitido}</td>
        <td class="der">Moneda: Soles (S/) &middot; Montos con IGV incluido</td>
    </tr></table>

    <table class="kpis"><tr>
        <td><p class="kpi-valor">{formatear_moneda(total_ventas)}</p><p class="kpi-etq">Ventas totales</p></td>
        <td><p class="kpi-valor">{n_pedidos}</p><p class="kpi-etq">Pedidos</p></td>
        <td><p class="kpi-valor">{unidades_totales}</p><p class="kpi-etq">Unidades vendidas</p></td>
        <td><p class="kpi-valor">{formatear_moneda(ticket_promedio)}</p><p class="kpi-etq">Ticket promedio</p></td>
    </tr></table>

    <table class="igv">
        <tr><td style="width: 48%;"></td><td>OP. GRAVADA (S/)</td><td class="monto">{_num(op_gravada)}</td></tr>
        <tr><td></td><td>IGV 18% (S/)</td><td class="monto">{_num(igv)}</td></tr>
        <tr><td></td><td>ENVÍO (S/)</td><td class="monto">{_num(total_envio)}</td></tr>
        <tr class="total"><td></td><td class="tl">TOTAL (S/)</td><td class="monto tl">{_num(total_ventas)}</td></tr>
    </table>

    <h2>Por método de pago</h2>
    <table class="datos">
        <tr><th>Método</th><th class="c">Pedidos</th><th class="r">Monto</th><th class="r">% del total</th></tr>
        {filas_metodo}
    </table>

    <h2>Por origen de la venta</h2>
    <table class="datos">
        <tr><th>Origen</th><th class="c">Pedidos</th><th class="r">Monto</th><th class="r">% del total</th></tr>
        {filas_origen}
    </table>

    <h2>Productos más vendidos</h2>
    <table class="datos">
        <tr><th style="width: 24px;">#</th><th>Producto</th><th class="c">Unidades</th><th class="r">Ingresos</th></tr>
        {filas_productos}
    </table>

    <h2>Ventas por día</h2>
    <table class="datos">
        <tr><th>Fecha</th><th class="c">Pedidos</th><th class="r">Monto</th></tr>
        {filas_dias}
    </table>

    <h2>Detalle de pedidos</h2>
    <table class="datos detalle">
        <tr><th style="width: 24%;">N° pedido</th><th style="width: 13%;">Fecha</th><th style="width: 23%;">Cliente</th><th style="width: 10%;">Origen</th><th style="width: 16%;">Método</th><th class="r" style="width: 14%;">Total</th></tr>
        {filas_pedidos}
    </table>

    <table class="criterio"><tr><td>
        <b>Criterio del reporte:</b> incluye pedidos con pago verificado, y ventas en efectivo ya entregadas.
        No incluye pedidos pendientes de pago, cancelados ni reembolsados. Fechas en hora de Lima.
        El IGV (18%) se calcula sobre la venta de productos; el envío se muestra aparte.
    </td></tr></table>

    <div id="pie_contenido">
        <table class="pie"><tr>
            <td>Anita New Style &middot; Reporte de ventas {rango}</td>
            <td class="der">Página <pdf:pagenumber /> de <pdf:pagecount /></td>
        </tr></table>
    </div>
</body></html>"""

    return html_a_pdf(html)
