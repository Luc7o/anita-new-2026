"""
Reportes de almacén en PDF: kardex de un producto, valorización del inventario
a costo y margen por producto. Usan el mismo estilo que el reporte de ventas.

Los costos salen de las compras a proveedores (costo promedio ponderado de cada
producto), por eso un producto que nunca se compró aparece "sin costo".
"""
from collections import OrderedDict
from datetime import datetime
from decimal import Decimal
from html import escape

from app.models import MovimientoStock
from app.utils.formato import a_lima, logo_html
from app.utils.pdf import html_a_pdf, formatear_moneda
from app.utils.reporte_ventas import _CSS, NOMBRE_TIENDA, WEB_TIENDA

_CSS_EXTRA = """
    h3.sub { font-size: 9.5pt; margin: 14px 0 4px 0; -pdf-keep-with-next: true; }
    p.resumen-grupo { font-size: 8pt; color: #444; margin-bottom: 4px; -pdf-keep-with-next: true; }
    table.datos td.neg { color: #8a1c1c; }
"""


def _fila_vacia(cols, texto):
    return f"<tr><td colspan='{cols}' class='c gris'>{texto}</td></tr>"


def _plata(valor):
    return formatear_moneda(valor) if valor is not None else "—"


def _pct(parte, total):
    return f"{(parte / total * 100):.1f}%" if parte is not None and total > 0 else "—"


def _fecha_lima(fecha, con_hora=True):
    if not fecha:
        return "—"
    return a_lima(fecha).strftime("%d/%m/%Y %H:%M" if con_hora else "%d/%m/%Y")


def _rango_texto(desde_str, hasta_str):
    if desde_str and hasta_str:
        return f"Del {desde_str} al {hasta_str}"
    if desde_str:
        return f"Desde {desde_str}"
    if hasta_str:
        return f"Hasta {hasta_str}"
    return "Todo el historial"


def _documento(titulo_caja, subtitulo, meta_derecha, cuerpo, criterio, nombre_pie):
    emitido = a_lima(datetime.utcnow()).strftime("%d/%m/%Y %H:%M")
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{escape(nombre_pie)}</title>
<style>{_CSS}{_CSS_EXTRA}</style></head>
<body>
    <table class="cab"><tr>
        <td style="width: 90px;">{logo_html(80)}</td>
        <td>
            <p class="tienda">{NOMBRE_TIENDA}</p>
            <p class="web"><b>Web:</b> {WEB_TIENDA}</p>
        </td>
        <td style="width: 150px;">
            <table class="caja-titulo">
                <tr><td class="t">{titulo_caja}</td></tr>
                <tr><td class="r" style="padding-bottom: 8px;">{escape(subtitulo)}</td></tr>
            </table>
        </td>
    </tr></table>

    <table class="meta"><tr>
        <td>Emitido el {emitido}</td>
        <td class="der">{meta_derecha}</td>
    </tr></table>

    {cuerpo}

    <table class="criterio"><tr><td>
        <b>Criterio del reporte:</b> {criterio}
    </td></tr></table>

    <div id="pie_contenido">
        <table class="pie"><tr>
            <td>Anita New Style &middot; {escape(nombre_pie)}</td>
            <td class="der">Página <pdf:pagenumber /> de <pdf:pagecount /></td>
        </tr></table>
    </div>
</body></html>"""


def _kpis(items):
    celdas = "".join(
        f"<td><p class='kpi-valor'>{valor}</p><p class='kpi-etq'>{etiqueta}</p></td>" for valor, etiqueta in items
    )
    return f"<table class=\"kpis\"><tr>{celdas}</tr></table>"


# ---------------------------------------------------------------------------
# Kardex
# ---------------------------------------------------------------------------

def _detalle_movimiento(m):
    partes = [escape(m.motivo)] if m.motivo else []
    if m.pedido_id:
        partes.append(f"Pedido #{m.pedido_id}")
    return " &middot; ".join(partes) or "—"


def generar_pdf_kardex(producto, movimientos, desde_str=None, hasta_str=None, truncado=False, variante_etiqueta=None):
    """
    `movimientos` va del más antiguo al más reciente. Si el producto tiene
    tallas y colores, se separa en una sección por variante, porque el saldo
    (stock después del movimiento) es de cada variante.
    """
    grupos = OrderedDict()
    for m in movimientos:
        etiqueta = None
        if m.variante:
            etiqueta = " · ".join(x for x in (f"Talla {m.variante.talla}" if m.variante.talla else None, m.variante.color) if x)
        grupos.setdefault(etiqueta, []).append(m)

    bloques = []
    total_entradas = total_salidas = 0
    for etiqueta, lista in grupos.items():
        entradas = sum(m.delta for m in lista if m.delta > 0)
        salidas = -sum(m.delta for m in lista if m.delta < 0)
        total_entradas += entradas
        total_salidas += salidas
        inicial = lista[0].stock_antes
        final = lista[-1].stock_despues

        filas = "".join(
            f"<tr><td>{_fecha_lima(m.fecha_creacion)}</td>"
            f"<td>{escape(MovimientoStock.ETIQUETAS.get(m.tipo, m.tipo))}</td>"
            f"<td>{_detalle_movimiento(m)}</td>"
            f"<td class='r'>{m.delta if m.delta > 0 else ''}</td>"
            f"<td class='r neg'>{m.delta if m.delta < 0 else ''}</td>"
            f"<td class='r'>{m.stock_despues if m.stock_despues is not None else '—'}</td>"
            f"<td class='r'>{_plata(m.costo_unitario)}</td>"
            f"<td>{escape(m.usuario.nombre_completo) if m.usuario else '—'}</td></tr>"
            for m in lista
        )
        titulo = f"<h3 class='sub'>{escape(etiqueta)}</h3>" if etiqueta else ""
        resumen = (
            f"<p class='resumen-grupo'>Saldo inicial: {inicial if inicial is not None else '—'} &middot; "
            f"Entradas: {entradas} &middot; Salidas: {salidas} &middot; "
            f"Saldo final: {final if final is not None else '—'}</p>"
        )
        bloques.append(f"""{titulo}{resumen}
    <table class="datos detalle">
        <tr><th style="width: 13%;">Fecha</th><th style="width: 13%;">Tipo</th><th>Detalle</th><th class="r" style="width: 7%;">Entra</th><th class="r" style="width: 7%;">Sale</th><th class="r" style="width: 8%;">Saldo</th><th class="r" style="width: 11%;">Costo unit.</th><th style="width: 13%;">Usuario</th></tr>
        {filas}
    </table>""")

    cuerpo_movs = "".join(bloques) or f"<table class='datos'>{_fila_vacia(1, 'No hay movimientos en este periodo')}</table>"
    aviso = (
        "<p class='resumen-grupo' style='color:#8a1c1c;'>Se muestran los primeros 3000 movimientos del periodo. "
        "Acota las fechas para ver el resto.</p>" if truncado else ""
    )

    cuerpo = (
        f"<p style='font-size:11pt; margin-top:6px;'><b>{escape(producto.nombre)}</b> "
        f"<span class='gris'>&middot; SKU {escape(producto.sku or '—')}</span></p>"
        + (f"<p class='gris'>{escape(variante_etiqueta)}</p>" if variante_etiqueta else "")
        + _kpis([
            (str(producto.stock_total), "Stock actual"),
            (str(total_entradas), "Entradas del periodo"),
            (str(total_salidas), "Salidas del periodo"),
            (str(len(movimientos)), "Movimientos"),
        ])
        + "<h2>Movimientos</h2>" + aviso + cuerpo_movs
    )

    criterio = (
        "cada fila es un cambio de stock registrado en el sistema, de m&aacute;s antiguo a m&aacute;s reciente. "
        "El saldo es el stock que qued&oacute; despu&eacute;s de ese movimiento. El costo unitario solo aparece en "
        "los ingresos por compra. Los movimientos anteriores a que existiera el kardex no tienen usuario ni saldo."
    )
    return html_a_pdf(_documento(
        "KARDEX DE<br />PRODUCTO", _rango_texto(desde_str, hasta_str),
        "Cantidades en unidades",
        cuerpo, criterio, "Kardex de producto",
    ))



# ---------------------------------------------------------------------------
# Valorización del inventario
# ---------------------------------------------------------------------------

def generar_pdf_valorizacion(productos):
    activos = [p for p in productos if p.activo]
    filas = []
    for p in activos:
        stock = max(p.stock_total, 0)
        costo = Decimal(p.costo_promedio) if p.costo_promedio is not None else None
        valor_costo = costo * stock if costo is not None else None
        valor_venta = Decimal(str(p.precio_final)) * stock
        filas.append({"p": p, "stock": stock, "costo": costo, "valor_costo": valor_costo, "valor_venta": valor_venta})

    con_stock = [f for f in filas if f["stock"] > 0]
    unidades = sum(f["stock"] for f in con_stock)
    valor_costo_total = sum((f["valor_costo"] for f in con_stock if f["valor_costo"] is not None), Decimal("0"))
    valor_venta_total = sum((f["valor_venta"] for f in con_stock), Decimal("0"))
    # Margen potencial solo con los productos que tienen costo, para comparar peras con peras.
    venta_con_costo = sum((f["valor_venta"] for f in con_stock if f["valor_costo"] is not None), Decimal("0"))
    margen_potencial = venta_con_costo - valor_costo_total
    pct = _pct(margen_potencial, venta_con_costo)
    sin_costo = [f for f in con_stock if f["valor_costo"] is None]

    por_categoria = {}
    for f in con_stock:
        nombre = f["p"].categoria.nombre if f["p"].categoria else "Sin categoría"
        c = por_categoria.setdefault(nombre, {"productos": 0, "unidades": 0, "costo": Decimal("0"), "venta": Decimal("0")})
        c["productos"] += 1
        c["unidades"] += f["stock"]
        c["costo"] += f["valor_costo"] or Decimal("0")
        c["venta"] += f["valor_venta"]
    filas_categoria = "".join(
        f"<tr><td>{escape(n)}</td><td class='c'>{d['productos']}</td><td class='c'>{d['unidades']}</td>"
        f"<td class='r'>{formatear_moneda(d['costo'])}</td><td class='r'>{formatear_moneda(d['venta'])}</td></tr>"
        for n, d in sorted(por_categoria.items(), key=lambda kv: -kv[1]["costo"])
    ) or _fila_vacia(5, "No hay productos con stock")

    ordenadas = sorted(con_stock, key=lambda f: (f["valor_costo"] is None, -(f["valor_costo"] or Decimal("0")), f["p"].nombre.lower()))
    filas_detalle = "".join(
        f"<tr><td>{escape(f['p'].sku or '—')}</td><td>{escape(f['p'].nombre)}</td>"
        f"<td class='c'>{f['stock']}</td><td class='r'>{_plata(f['costo'])}</td>"
        f"<td class='r'>{_plata(f['valor_costo'])}</td><td class='r'>{formatear_moneda(f['p'].precio_final)}</td>"
        f"<td class='r'>{formatear_moneda(f['valor_venta'])}</td></tr>"
        for f in ordenadas
    ) or _fila_vacia(7, "No hay productos con stock")

    cuerpo = (
        _kpis([
            (str(unidades), "Unidades en stock"),
            (formatear_moneda(valor_costo_total), "Valor a costo"),
            (formatear_moneda(valor_venta_total), "Valor a precio de venta"),
            (f"{formatear_moneda(margen_potencial)} ({pct})", "Margen potencial"),
        ])
        + f"""
    <h2>Por categor&iacute;a</h2>
    <table class="datos">
        <tr><th>Categor&iacute;a</th><th class="c">Productos</th><th class="c">Unidades</th><th class="r">Valor a costo</th><th class="r">Valor a precio de venta</th></tr>
        {filas_categoria}
    </table>

    <h2>Detalle por producto</h2>
    <table class="datos detalle">
        <tr><th style="width: 13%;">SKU</th><th>Producto</th><th class="c" style="width: 8%;">Stock</th><th class="r" style="width: 13%;">Costo prom.</th><th class="r" style="width: 14%;">Valor a costo</th><th class="r" style="width: 12%;">Precio</th><th class="r" style="width: 14%;">Valor a venta</th></tr>
        {filas_detalle}
    </table>"""
    )

    aviso_sin_costo = (
        f" {len(sin_costo)} producto{'s' if len(sin_costo) != 1 else ''} con stock no tiene{'n' if len(sin_costo) != 1 else ''} "
        "costo registrado (aparece con &laquo;&mdash;&raquo;): no suma al valor a costo ni al margen potencial."
        if sin_costo else ""
    )
    criterio = (
        "el valor a costo es el stock actual por el costo promedio ponderado de las compras registradas. "
        "El valor a precio de venta usa el precio vigente (con oferta si la hay). El margen potencial compara ambos "
        "solo en los productos que tienen costo. El stock de los productos con tallas o colores es la suma de sus variantes. "
        "Solo productos activos con stock." + aviso_sin_costo
    )
    return html_a_pdf(_documento(
        "VALORIZACI&Oacute;N DE<br />INVENTARIO", "Stock actual a costo",
        "Moneda: Soles (S/)", cuerpo, criterio, "Valorización de inventario",
    ))


# ---------------------------------------------------------------------------
# Margen por producto
# ---------------------------------------------------------------------------

def _clase_margen(margen):
    return "neg" if margen is not None and margen < 0 else ""


def generar_pdf_margen(pedidos, desde_str=None, hasta_str=None):
    ventas = {}  # producto_id -> dict
    for ped in pedidos:
        for d in ped.detalles:
            if not d.producto:
                continue
            v = ventas.setdefault(d.producto_id, {
                "p": d.producto, "unidades": 0, "ingreso": Decimal("0"),
            })
            v["unidades"] += d.cantidad
            v["ingreso"] += Decimal(d.subtotal)

    filas = []
    for v in ventas.values():
        costo = Decimal(v["p"].costo_promedio) if v["p"].costo_promedio is not None else None
        costo_total = costo * v["unidades"] if costo is not None else None
        margen = v["ingreso"] - costo_total if costo_total is not None else None
        filas.append({**v, "costo": costo_total, "margen": margen})

    con_costo = [f for f in filas if f["costo"] is not None]
    sin_costo = [f for f in filas if f["costo"] is None]
    ingreso_total = sum((f["ingreso"] for f in filas), Decimal("0"))
    ingreso_con_costo = sum((f["ingreso"] for f in con_costo), Decimal("0"))
    costo_total = sum((f["costo"] for f in con_costo), Decimal("0"))
    margen_total = ingreso_con_costo - costo_total
    pct_total = _pct(margen_total, ingreso_con_costo)
    ingreso_sin_costo = sum((f["ingreso"] for f in sin_costo), Decimal("0"))

    ordenadas = sorted(filas, key=lambda f: (f["margen"] is None, -(f["margen"] or Decimal("0")), f["p"].nombre.lower()))
    filas_html = "".join(
        f"<tr><td>{escape(f['p'].nombre)}</td><td class='c'>{f['unidades']}</td>"
        f"<td class='r'>{formatear_moneda(f['ingreso'])}</td><td class='r'>{_plata(f['costo'])}</td>"
        f"<td class='r {_clase_margen(f['margen'])}'>{_plata(f['margen'])}</td>"
        f"<td class='r'>{_pct(f['margen'], f['ingreso'])}</td></tr>"
        for f in ordenadas
    ) or _fila_vacia(6, "No hay ventas en este periodo")

    cuerpo = (
        _kpis([
            (formatear_moneda(ingreso_total), "Vendido en productos"),
            (formatear_moneda(costo_total), "Costo de lo vendido"),
            (formatear_moneda(margen_total), "Margen"),
            (pct_total, "Margen sobre lo vendido"),
        ])
        + f"""
    <h2>Margen por producto</h2>
    <table class="datos detalle">
        <tr><th>Producto</th><th class="c" style="width: 10%;">Unidades</th><th class="r" style="width: 16%;">Vendido</th><th class="r" style="width: 16%;">Costo</th><th class="r" style="width: 16%;">Margen</th><th class="r" style="width: 10%;">%</th></tr>
        {filas_html}
    </table>"""
    )

    aviso_sin_costo = (
        f" {len(sin_costo)} producto{'s' if len(sin_costo) != 1 else ''} vendido{'s' if len(sin_costo) != 1 else ''} "
        f"({formatear_moneda(ingreso_sin_costo)}) no tiene{'n' if len(sin_costo) != 1 else ''} costo registrado: "
        "aparece con &laquo;&mdash;&raquo; y no entra en el costo ni en el margen."
        if sin_costo else ""
    )
    criterio = (
        "se cuentan las ventas confirmadas del periodo (pago verificado, o entregadas si no requieren verificaci&oacute;n), "
        "igual que en el reporte de ventas. Lo vendido es lo cobrado por los productos, sin el env&iacute;o. "
        "El costo es el costo promedio ACTUAL del producto por las unidades vendidas, no el costo que ten&iacute;a el d&iacute;a "
        "de la venta, por eso el margen de periodos antiguos es una referencia." + aviso_sin_costo
    )
    return html_a_pdf(_documento(
        "MARGEN POR<br />PRODUCTO", _rango_texto(desde_str, hasta_str),
        "Moneda: Soles (S/)", cuerpo, criterio, "Margen por producto",
    ))
