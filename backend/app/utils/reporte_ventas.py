"""
Reporte de ventas en PDF para el dashboard de administrador — usa el mismo
generar_pdf() que boleta.py, así que comparte el CSS de marca sin duplicarlo.
"""
from collections import Counter, defaultdict

from app.utils.pdf import generar_pdf, formatear_moneda


def generar_pdf_reporte_ventas(pedidos, desde_str=None, hasta_str=None):
    """
    Recibe una lista de Pedido (ya filtrados por quien llama: rango de
    fechas, solo pagos confirmados) y arma el PDF con el resumen: total
    vendido, desglose por método de pago, por origen (online/presencial) y
    los productos más vendidos.
    """
    total_ventas = sum(float(p.total) for p in pedidos)
    n_pedidos = len(pedidos)

    pedidos_por_metodo = Counter()
    monto_por_metodo = defaultdict(float)
    pedidos_por_origen = Counter()
    monto_por_origen = defaultdict(float)
    unidades_por_producto = Counter()

    for p in pedidos:
        pedidos_por_metodo[p.metodo_pago_label] += 1
        monto_por_metodo[p.metodo_pago_label] += float(p.total)

        pedidos_por_origen[p.origen_label] += 1
        monto_por_origen[p.origen_label] += float(p.total)

        for d in p.detalles:
            nombre = d.producto.nombre if d.producto else "Producto eliminado"
            unidades_por_producto[nombre] += d.cantidad

    filas_metodo = "".join(
        f"<tr><td>{metodo}</td><td>{cantidad}</td><td>{formatear_moneda(monto_por_metodo[metodo])}</td></tr>"
        for metodo, cantidad in pedidos_por_metodo.most_common()
    ) or "<tr><td colspan='3'>Sin ventas en este rango</td></tr>"

    filas_origen = "".join(
        f"<tr><td>{origen}</td><td>{cantidad}</td><td>{formatear_moneda(monto_por_origen[origen])}</td></tr>"
        for origen, cantidad in pedidos_por_origen.most_common()
    ) or "<tr><td colspan='3'>Sin ventas en este rango</td></tr>"

    filas_productos = "".join(
        f"<tr><td>{nombre}</td><td>{unidades}</td></tr>"
        for nombre, unidades in unidades_por_producto.most_common(10)
    ) or "<tr><td colspan='2'>Sin ventas en este rango</td></tr>"

    if desde_str or hasta_str:
        rango = f"Del {desde_str or 'inicio'} al {hasta_str or 'hoy'}"
    else:
        rango = "Todo el historial"

    html = f"""
    <h1>Reporte de ventas</h1>
    <p class="subtitulo">{rango}</p>

    <div class="caja">
        <strong>{n_pedidos}</strong> pedido{"s" if n_pedidos != 1 else ""} vendido{"s" if n_pedidos != 1 else ""}
        &nbsp;·&nbsp; Total: <strong>{formatear_moneda(total_ventas)}</strong>
    </div>

    <h2>Por método de pago</h2>
    <table>
        <tr><th>Método</th><th>Pedidos</th><th>Monto</th></tr>
        {filas_metodo}
    </table>

    <h2>Por origen</h2>
    <table>
        <tr><th>Origen</th><th>Pedidos</th><th>Monto</th></tr>
        {filas_origen}
    </table>

    <h2>Productos más vendidos</h2>
    <table>
        <tr><th>Producto</th><th>Unidades</th></tr>
        {filas_productos}
    </table>
    """

    return generar_pdf(html, titulo=f"Reporte de ventas — {rango}")
