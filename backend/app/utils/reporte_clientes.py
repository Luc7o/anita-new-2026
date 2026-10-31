"""
Reporte de clientes en PDF: clientes registrados, nuevos del periodo, quiénes
compraron, recurrentes y los que más compran. Mismo estilo que el reporte de ventas.
"""
from collections import defaultdict
from datetime import datetime
from html import escape

from app.utils.formato import a_lima, logo_html
from app.utils.pdf import html_a_pdf, formatear_moneda
from app.utils.reporte_ventas import _CSS, NOMBRE_TIENDA, WEB_TIENDA


def _fila_vacia(cols, texto):
    return f"<tr><td colspan='{cols}' class='c gris'>{texto}</td></tr>"


def _nombre(u):
    return f"{u.nombre} {u.apellido}".strip()


def generar_pdf_reporte_clientes(clientes, pedidos, usuarios_por_id, desde, hasta, desde_str=None, hasta_str=None):
    """
    clientes: Usuario registrados (no admin, no invitado).
    pedidos: ventas confirmadas del rango.
    usuarios_por_id: {id: Usuario} para ponerle nombre a quien compró.
    desde / hasta: límites UTC (o None) usados para contar a los nuevos.
    """
    clientes = list(clientes)
    pedidos = list(pedidos)

    nuevos = [
        u for u in clientes
        if u.fecha_registro
        and (desde is None or u.fecha_registro >= desde)
        and (hasta is None or u.fecha_registro < hasta)
    ]

    compras = defaultdict(lambda: {"pedidos": 0, "total": 0.0})
    sin_cuenta = 0
    for p in pedidos:
        if p.usuario_id:
            compras[p.usuario_id]["pedidos"] += 1
            compras[p.usuario_id]["total"] += float(p.total)
        else:
            sin_cuenta += 1

    compradores = len(compras)
    recurrentes = sum(1 for c in compras.values() if c["pedidos"] >= 2)

    top = sorted(compras.items(), key=lambda kv: -kv[1]["total"])[:10]
    filas_top = "".join(
        f"<tr><td>{i}</td><td>{escape(_nombre(usuarios_por_id[uid]) if uid in usuarios_por_id else 'Cliente')}</td>"
        f"<td class='c'>{c['pedidos']}</td><td class='r'>{formatear_moneda(c['total'])}</td></tr>"
        for i, (uid, c) in enumerate(top, start=1)
    ) or _fila_vacia(4, "Sin compras en este rango")

    filas_nuevos = "".join(
        f"<tr><td>{escape(_nombre(u))}</td><td>{escape(u.email)}</td>"
        f"<td>{a_lima(u.fecha_registro).strftime('%d/%m/%Y')}</td></tr>"
        for u in sorted(nuevos, key=lambda x: x.fecha_registro, reverse=True)[:40]
    ) or _fila_vacia(3, "No hubo clientes nuevos en este rango")

    rango = f"Del {desde_str or 'inicio'} al {hasta_str or 'hoy'}" if (desde_str or hasta_str) else "Todo el historial"
    emitido = a_lima(datetime.utcnow()).strftime("%d/%m/%Y %H:%M")

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reporte de clientes — {rango}</title>
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
                <tr><td class="t">REPORTE DE<br />CLIENTES</td></tr>
                <tr><td class="r" style="padding-bottom: 8px;">{rango}</td></tr>
            </table>
        </td>
    </tr></table>

    <table class="meta"><tr>
        <td>Emitido el {emitido}</td>
        <td class="der">Moneda: Soles (S/)</td>
    </tr></table>

    <table class="kpis"><tr>
        <td><p class="kpi-valor">{len(clientes)}</p><p class="kpi-etq">Clientes registrados</p></td>
        <td><p class="kpi-valor">{len(nuevos)}</p><p class="kpi-etq">Nuevos en el rango</p></td>
        <td><p class="kpi-valor">{compradores}</p><p class="kpi-etq">Compraron con cuenta</p></td>
        <td><p class="kpi-valor">{recurrentes}</p><p class="kpi-etq">Recurrentes (2 o más)</p></td>
    </tr></table>

    <h2>Clientes que más compran</h2>
    <table class="datos">
        <tr><th style="width: 24px;">#</th><th>Cliente</th><th class="c">Pedidos</th><th class="r">Total comprado</th></tr>
        {filas_top}
    </table>

    <h2>Clientes nuevos</h2>
    <table class="datos">
        <tr><th>Cliente</th><th>Correo</th><th>Registro</th></tr>
        {filas_nuevos}
    </table>

    <table class="criterio"><tr><td>
        <b>Criterio del reporte:</b> cuenta clientes con cuenta registrada (no invitados ni personal del panel).
        Las compras son ventas confirmadas del rango ({sin_cuenta} sin cuenta, como ventas en tienda o compras sin registro, no se asignan a un cliente).
        Fechas en hora de Lima.
    </td></tr></table>

    <div id="pie_contenido">
        <table class="pie"><tr>
            <td>Anita New Style &middot; Reporte de clientes {rango}</td>
            <td class="der">Página <pdf:pagenumber /> de <pdf:pagecount /></td>
        </tr></table>
    </div>
</body></html>"""
    return html_a_pdf(html)
