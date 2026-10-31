"""
Reporte de inventario en PDF: stock actual por producto, productos por reponer
y valor del inventario a precio de venta. Usa el mismo estilo que el reporte
de ventas.
"""
from collections import defaultdict
from datetime import datetime
from html import escape

from app.utils.formato import a_lima, logo_html
from app.utils.pdf import html_a_pdf, formatear_moneda
from app.utils.reporte_ventas import _CSS, NOMBRE_TIENDA, WEB_TIENDA

# Mismo umbral que el aviso de "poco stock" del dashboard.
UMBRAL_BAJO_STOCK = 3


def _fila_vacia(cols, texto):
    return f"<tr><td colspan='{cols}' class='c gris'>{texto}</td></tr>"


def _estado(stock):
    if stock <= 0:
        return "Agotado"
    if stock <= UMBRAL_BAJO_STOCK:
        return "Stock bajo"
    return "Disponible"


def generar_pdf_reporte_inventario(productos, solo_alerta=False):
    productos = list(productos)
    activos = [p for p in productos if p.activo]

    unidades = sum(p.stock_total for p in activos)
    agotados = [p for p in activos if p.stock_total <= 0]
    bajos = [p for p in activos if 0 < p.stock_total <= UMBRAL_BAJO_STOCK]
    valor = sum(p.precio_final * max(p.stock_total, 0) for p in activos)

    por_categoria = defaultdict(lambda: {"productos": 0, "unidades": 0, "valor": 0.0})
    for p in activos:
        c = por_categoria[p.categoria.nombre if p.categoria else "Sin categoría"]
        c["productos"] += 1
        c["unidades"] += max(p.stock_total, 0)
        c["valor"] += p.precio_final * max(p.stock_total, 0)

    filas_categoria = "".join(
        f"<tr><td>{escape(nombre)}</td><td class='c'>{d['productos']}</td>"
        f"<td class='c'>{d['unidades']}</td><td class='r'>{formatear_moneda(d['valor'])}</td></tr>"
        for nombre, d in sorted(por_categoria.items(), key=lambda kv: -kv[1]["unidades"])
    ) or _fila_vacia(4, "Sin productos activos")

    por_reponer = sorted(agotados + bajos, key=lambda p: (p.stock_total, p.nombre))
    filas_reponer = "".join(
        f"<tr><td>{escape(p.sku or '—')}</td><td>{escape(p.nombre)}</td>"
        f"<td>{escape(p.categoria.nombre if p.categoria else '—')}</td>"
        f"<td class='c'>{p.stock_total}</td><td>{_estado(p.stock_total)}</td></tr>"
        for p in por_reponer
    ) or _fila_vacia(5, "No hay productos por reponer")

    bloque_completo = ""
    if not solo_alerta:
        filas_completo = "".join(
            f"<tr><td>{escape(p.sku or '—')}</td><td>{escape(p.nombre)}</td>"
            f"<td>{escape(p.categoria.nombre if p.categoria else '—')}</td>"
            f"<td class='r'>{formatear_moneda(p.precio_final)}</td>"
            f"<td class='c'>{p.stock_total}</td>"
            f"<td>{'Activo' if p.activo else 'Inactivo'}</td></tr>"
            for p in sorted(productos, key=lambda x: x.nombre.lower())
        ) or _fila_vacia(6, "Sin productos")
        bloque_completo = f"""
    <h2>Inventario completo</h2>
    <table class="datos detalle">
        <tr><th style="width: 14%;">SKU</th><th>Producto</th><th style="width: 18%;">Categoría</th><th class="r" style="width: 14%;">Precio</th><th class="c" style="width: 9%;">Stock</th><th style="width: 11%;">Estado</th></tr>
        {filas_completo}
    </table>"""

    rango = "Solo productos por reponer" if solo_alerta else "Stock actual"
    emitido = a_lima(datetime.utcnow()).strftime("%d/%m/%Y %H:%M")

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reporte de inventario</title>
<style>{_CSS}</style></head>
<body>
    <table class="cab"><tr>
        <td style="width: 90px;">{logo_html(80)}</td>
        <td>
            <p class="tienda">{NOMBRE_TIENDA}</p>
            <p class="web"><b>Web:</b> {WEB_TIENDA}</p>
        </td>
        <td style="width: 150px;">
            <table class="caja-titulo">
                <tr><td class="t">REPORTE DE<br />INVENTARIO</td></tr>
                <tr><td class="r" style="padding-bottom: 8px;">{rango}</td></tr>
            </table>
        </td>
    </tr></table>

    <table class="meta"><tr>
        <td>Emitido el {emitido}</td>
        <td class="der">Moneda: Soles (S/) &middot; Valor a precio de venta</td>
    </tr></table>

    <table class="kpis"><tr>
        <td><p class="kpi-valor">{len(activos)}</p><p class="kpi-etq">Productos activos</p></td>
        <td><p class="kpi-valor">{unidades}</p><p class="kpi-etq">Unidades en stock</p></td>
        <td><p class="kpi-valor">{len(bajos)} / {len(agotados)}</p><p class="kpi-etq">Stock bajo / Agotados</p></td>
        <td><p class="kpi-valor">{formatear_moneda(valor)}</p><p class="kpi-etq">Valor del inventario</p></td>
    </tr></table>

    <h2>Por categoría</h2>
    <table class="datos">
        <tr><th>Categoría</th><th class="c">Productos</th><th class="c">Unidades</th><th class="r">Valor</th></tr>
        {filas_categoria}
    </table>

    <h2>Productos por reponer</h2>
    <table class="datos">
        <tr><th style="width: 16%;">SKU</th><th>Producto</th><th style="width: 20%;">Categoría</th><th class="c" style="width: 10%;">Stock</th><th style="width: 14%;">Estado</th></tr>
        {filas_reponer}
    </table>
    {bloque_completo}

    <table class="criterio"><tr><td>
        <b>Criterio del reporte:</b> el stock de los productos con tallas o colores es la suma de todas sus variantes.
        &laquo;Stock bajo&raquo; son {UMBRAL_BAJO_STOCK} unidades o menos. Los totales y el valor consideran solo productos activos.
    </td></tr></table>

    <div id="pie_contenido">
        <table class="pie"><tr>
            <td>Anita New Style &middot; Reporte de inventario</td>
            <td class="der">Página <pdf:pagenumber /> de <pdf:pagecount /></td>
        </tr></table>
    </div>
</body></html>"""
    return html_a_pdf(html)
