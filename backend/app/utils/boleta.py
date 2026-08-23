"""
Boleta compartida por el pedido online (backend/app/routes/pedidos.py) y por
la venta presencial que se agregará en el paso 3 (backend/app/routes/
admin_pedidos.py) — un solo lugar arma el HTML, así ambos flujos generan
exactamente el mismo formato de comprobante.
"""
from app.utils.pdf import generar_pdf, formatear_moneda


def _fila_detalle(detalle):
    variante = ""
    if detalle.get("talla") or detalle.get("color"):
        partes = [v for v in (detalle.get("talla"), detalle.get("color")) if v]
        variante = f" <span style='color:#6B4C57'>({' / '.join(partes)})</span>"

    nombre = detalle.get("producto_nombre") or "Producto no disponible"

    return f"""
    <tr>
        <td>{nombre}{variante}</td>
        <td>{detalle['cantidad']}</td>
        <td>{formatear_moneda(detalle['precio_unit'])}</td>
        <td>{formatear_moneda(detalle['subtotal'])}</td>
    </tr>
    """


def generar_pdf_boleta(pedido):
    """
    Recibe una instancia de Pedido (con estado_pago='verificado') y devuelve
    los bytes del PDF de su boleta. Funciona igual para un pedido que vino
    del checkout online que para una venta presencial — ambos comparten el
    mismo modelo Pedido y el mismo to_dict().
    """
    data = pedido.to_dict(con_detalles=True)

    filas = "".join(_fila_detalle(d) for d in data["detalles"])

    # Dirección de envío solo aplica si el pedido fue delivery — una venta
    # presencial (tipo_entrega='recojo') no tiene nada que mostrar aquí.
    bloque_entrega = ""
    if data["tipo_entrega"] == "delivery":
        direccion = ", ".join(
            filter(None, [data.get("envio_direccion"), data.get("envio_distrito"), data.get("envio_provincia")])
        )
        bloque_entrega = f"""
        <h2>Entrega</h2>
        <p>{direccion or "—"}</p>
        """

    html = f"""
    <h1>Boleta de venta</h1>
    <p class="subtitulo">
        Pedido {data['numero_pedido']} &nbsp;·&nbsp;
        {data['fecha_creacion'][:10]} &nbsp;·&nbsp;
        {data['metodo_pago_label']}
    </p>

    <h2>Cliente</h2>
    <p>
        {data.get('envio_nombre') or "—"}<br>
        {data.get('envio_telefono') or ""}
    </p>

    {bloque_entrega}

    <h2>Detalle</h2>
    <table>
        <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
        {filas}
    </table>

    <table class="totales" style="width: 260px; margin-left: auto;">
        <tr><td>Subtotal</td><td class="monto">{formatear_moneda(data['subtotal'])}</td></tr>
        <tr><td>Envío</td><td class="monto">{formatear_moneda(data['costo_envio'])}</td></tr>
        <tr><td class="total-final">Total</td><td class="monto total-final">{formatear_moneda(data['total'])}</td></tr>
    </table>
    """

    return generar_pdf(html, titulo=f"Boleta {data['numero_pedido']}")