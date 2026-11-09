from sqlalchemy import text
from app.extensions import db
from app.models import Producto, MovimientoStock, VarianteProducto


def _stock_actual(variante_id):
    """Stock que hay ahora mismo en la base para esa variante."""
    fila = db.session.execute(
        text("SELECT stock FROM variantes_producto WHERE id = :id"), {"id": variante_id}
    ).first()
    return fila.stock if fila else None


def foto_stock(producto):
    """
    Foto del stock de un producto ANTES de editarlo: {(talla, color): stock}.
    Un producto simple tiene una sola variante, con la clave ("", ""). Se compara
    con el stock resultante en registrar_cambios_de_stock.
    """
    return {(v.talla or "", v.color or ""): int(v.stock or 0) for v in producto.variantes}


def registrar_cambios_de_stock(producto, antes, usuario_id=None, motivo=None, tipo="ajuste_manual"):
    """
    Compara la foto `antes` (de foto_stock) con el stock que quedó guardado y
    registra un movimiento por cada variante cuyo stock cambió. Devuelve
    cuántos movimientos registró. No hace commit: va en la misma transacción
    que el cambio del producto, así que si el guardado falla, no queda rastro.
    """
    db.session.flush()
    variantes = VarianteProducto.query.filter_by(producto_id=producto.id).all()
    despues = {(v.talla or "", v.color or ""): (v.id, int(v.stock or 0)) for v in variantes}

    claves = list(antes.keys()) + [c for c in despues if c not in antes]
    registrados = 0
    for clave in claves:
        stock_antes = antes.get(clave, 0)
        variante_id, stock_despues = despues.get(clave, (None, 0))
        diferencia = stock_despues - stock_antes
        if diferencia == 0:
            continue
        db.session.add(MovimientoStock(
            variante_id=variante_id,
            producto_id=producto.id,
            tipo=tipo,
            cantidad=diferencia,
            usuario_id=usuario_id,
            motivo=motivo,
            stock_antes=stock_antes,
            stock_despues=stock_despues,
        ))
        registrados += 1
    return registrados


def variante_de(item):
    """
    La variante a la que corresponde una línea (de carrito, de pedido o de una venta en
    tienda). Si la línea ya trae variante_id se usa esa; si no (pedidos antiguos, o ventas
    en tienda que llegan con talla y color como texto) se busca por producto, talla y color.
    Devuelve None si esa variante ya no existe.
    """
    variante_id = getattr(item, "variante_id", None)
    if variante_id is not None:
        return db.session.get(VarianteProducto, variante_id)
    producto = getattr(item, "producto", None)
    return producto.variante_para(item.talla, item.color) if producto else None


def agrupar_por_variante(items):
    """
    Suma las cantidades de una lista de ItemCarrito, DetallePedido o líneas de venta por
    la VARIANTE que les corresponde (todo producto tiene al menos una).

    Devuelve (grupos, variantes): grupos es {variante_id: cantidad_total} y variantes es
    {variante_id: VarianteProducto}. Una línea cuya variante ya no existe queda bajo la
    clave None.
    """
    grupos = {}
    variantes = {}
    for item in items:
        variante = variante_de(item)
        clave = variante.id if variante else None
        if variante:
            variantes[clave] = variante
        grupos[clave] = grupos.get(clave, 0) + item.cantidad
    return grupos, variantes


def validar_stock_disponible(grupos, variantes):
    """
    Revisa (sin modificar nada) si hay stock suficiente para cada grupo.
    Devuelve un mensaje de error si falta stock en alguno, o None si todo bien.
    """
    for variante_id, cantidad_pedida in grupos.items():
        variante = variantes.get(variante_id)
        if variante is None:
            return "Uno de los productos de tu carrito ya no existe"
        if cantidad_pedida > variante.stock:
            return f"Stock insuficiente para {variante.producto.nombre} (disponible: {variante.stock})"
    return None


def _describir_variante(talla, color):
    partes = [p for p in (f"talla {talla}" if talla else None, color or None) if p]
    return " en " + " y ".join(partes) if partes else ""


def validar_stock_disponible_items(items, grupos=None, variantes=None):
    """
    Como validar_stock_disponible, pero pensada para el checkout: en vez de
    devolver solo el primer error como un string genérico, revisa CADA
    ítem del carrito por separado y devuelve una lista con el detalle de
    todos los que se quedaron sin stock suficiente (puede haber más de
    uno). Cada problema trae el id del ItemCarrito afectado, para que el
    frontend pueda señalarlo junto al producto exacto en vez de mostrar un
    error genérico de servidor.

    grupos/variantes se pueden pasar ya calculados (de agrupar_por_variante)
    para no repetir esa consulta; si no se pasan, se calculan acá.

    Devuelve una lista de dicts (vacía si todo está bien):
      {item_id, producto_id, producto_nombre, talla, color,
       disponible, pedido, mensaje}
    """
    if grupos is None or variantes is None:
        grupos, variantes = agrupar_por_variante(items)

    problemas = []
    for item in items:
        variante = variante_de(item)

        if variante is None:
            problemas.append({
                "item_id": item.id,
                "producto_id": getattr(item, "producto_id", None),
                "producto_nombre": None,
                "talla": getattr(item, "talla", None),
                "color": getattr(item, "color", None),
                "disponible": 0,
                "pedido": item.cantidad,
                "mensaje": "Uno de los productos de tu carrito ya no existe.",
            })
            continue

        producto = variante.producto
        # Cuánto pide el GRUPO en total (normalmente coincide con este ítem solo, ya que
        # el carrito guarda una única línea por variante).
        cantidad_grupo = grupos.get(variante.id, item.cantidad)
        disponible = variante.stock

        if cantidad_grupo > disponible:
            detalle_variante = _describir_variante(variante.talla, variante.color)
            if disponible <= 0:
                mensaje = f"Ya no queda{detalle_variante} de {producto.nombre}."
            else:
                mensaje = f"Solo quedan {disponible} unidades{detalle_variante} de {producto.nombre}."
            problemas.append({
                "item_id": item.id,
                "producto_id": producto.id,
                "producto_nombre": producto.nombre,
                "talla": variante.talla,
                "color": variante.color,
                "disponible": disponible,
                "pedido": item.cantidad,
                "mensaje": mensaje,
            })

    return problemas


def descontar_stock(grupos, variantes, pedido_id=None, usuario_id=None, motivo=None):
    """
    Descuenta stock de forma ATÓMICA (a nivel de base de datos): cada UPDATE
    solo aplica si en ese instante sigue habiendo stock suficiente, evitando
    sobreventa si dos compras de la misma variante llegan casi al mismo tiempo.
    Devuelve un mensaje de error si alguna falló (y esa parte no se aplica),
    o None si todo se descontó correctamente.

    KPIs: cada descuento que sí se aplica queda registrado en movimiento_stock
    (tipo='venta') para poder reconstruir el historial de stock después.
    usuario_id (quien registró la venta, si fue personal de la tienda) y motivo
    son opcionales.
    """
    # Las variantes se recorren SIEMPRE en el mismo orden (por producto y luego por
    # variante, como utils/compras.py): si dos compras piden las mismas dos variantes
    # en orden inverso y se descontaran en el orden del carrito, cada una bloquearía
    # una fila esperando la otra (deadlock) y la base cancelaría una de las dos.
    pendientes = []
    for variante_id, cantidad in grupos.items():
        variante = variantes.get(variante_id)
        pendientes.append((variante.producto_id if variante else 0, variante_id, variante, cantidad))
    pendientes.sort(key=lambda p: (p[0], p[1] or 0))

    for producto_id, variante_id, variante, cantidad in pendientes:
        # Se actualiza por id (clave primaria): una sola fila. Si la variante ya no
        # existe, no hay fila que actualizar y se informa como cuando no alcanza el stock.
        filas = 0
        if variante_id is not None:
            filas = db.session.execute(
                text(
                    "UPDATE variantes_producto SET stock = stock - :cantidad "
                    "WHERE id = :vid AND stock >= :cantidad"
                ),
                {"cantidad": cantidad, "vid": variante_id},
            ).rowcount

        if filas == 0:
            nombre = variante.producto.nombre if variante else "un producto de tu carrito"
            return f"'{nombre}' se quedó sin stock justo ahora. Actualiza tu carrito e intenta de nuevo."

        # La fila sigue bloqueada por nuestro propio UPDATE (misma transacción),
        # así que este SELECT devuelve exactamente el stock que quedó.
        stock_despues = _stock_actual(variante_id)
        db.session.add(MovimientoStock(
            variante_id=variante_id,
            producto_id=producto_id,
            tipo="venta",
            cantidad=cantidad,
            pedido_id=pedido_id,
            usuario_id=usuario_id,
            motivo=motivo,
            stock_antes=(stock_despues + cantidad) if stock_despues is not None else None,
            stock_despues=stock_despues,
        ))

    return None


def restaurar_stock_de_pedido(pedido, usuario_id=None, motivo=None):
    """
    Devuelve al stock las cantidades de un pedido (al cancelarlo).
    Devuelve True si devolvió stock, False si ese pedido ya lo había devuelto.

    Usa detalle.variante_id (referencia histórica directa), que es la forma correcta y a
    prueba de que el producto haya cambiado después del pedido. Si un detalle no la tiene
    (pedido antiguo, o su variante se eliminó y se volvió a crear), se busca la variante
    por producto + talla + color. Si ya no existe ninguna, no hay a dónde devolver stock.
    """
    # Idempotente: un pedido devuelve su stock UNA sola vez. Si por cualquier
    # camino (cron, cancelación del cliente, panel admin) se llama de nuevo para
    # un pedido que ya devolvió su stock, no se hace nada: devolverlo dos veces
    # inflaría el inventario con unidades que no existen.
    if MovimientoStock.query.filter_by(pedido_id=pedido.id, tipo="restauracion").first():
        return False

    totales = {}  # variante_id -> (producto_id, cantidad)
    for d in pedido.detalles.all():
        variante_id = d.variante_id
        if variante_id is None:
            producto = db.session.get(Producto, d.producto_id)
            variante = producto.variante_para(d.talla, d.color) if producto else None
            variante_id = variante.id if variante else None
        if variante_id is None:
            continue  # la variante ya no existe: no hay a dónde devolver el stock
        _, acumulado = totales.get(variante_id, (d.producto_id, 0))
        totales[variante_id] = (d.producto_id, acumulado + d.cantidad)

    # Mismo orden de bloqueo que al descontar (ver descontar_stock).
    for variante_id, (producto_id, cantidad) in sorted(totales.items(), key=lambda kv: (kv[1][0], kv[0])):
        db.session.execute(
            text("UPDATE variantes_producto SET stock = stock + :cantidad WHERE id = :vid"),
            {"cantidad": cantidad, "vid": variante_id},
        )
        stock_despues = _stock_actual(variante_id)
        db.session.add(MovimientoStock(
            variante_id=variante_id,
            producto_id=producto_id,
            tipo="restauracion",
            cantidad=cantidad,
            pedido_id=pedido.id,
            usuario_id=usuario_id,
            motivo=motivo,
            stock_antes=(stock_despues - cantidad) if stock_despues is not None else None,
            stock_despues=stock_despues,
        ))

    return True
