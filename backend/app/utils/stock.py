from sqlalchemy import text
from app.extensions import db
from app.models import Producto


def agrupar_por_producto(items):
    """
    Agrupa una lista de ItemCarrito o DetallePedido por la clave de stock que
    realmente les corresponde:
    - Si el producto usa variantes (stock por talla/color), agrupa por
      (producto_id, talla, color).
    - Si no, agrupa todo bajo (producto_id, "", ""), sin importar la
      talla/color que haya llevado cada ítem (son solo informativos ahí).

    Devuelve (grupos, productos_cache) donde grupos es
    {(producto_id, talla, color): cantidad_total} y productos_cache es
    {producto_id: Producto} para no repetir consultas.
    """
    grupos = {}
    productos_cache = {}

    for item in items:
        if item.producto_id not in productos_cache:
            productos_cache[item.producto_id] = Producto.query.get(item.producto_id)
        producto = productos_cache[item.producto_id]

        if producto and producto.usa_variantes:
            # Mismo sentinel que VarianteProducto: '' para el eje que el
            # producto no usa. NUNCA None/NULL aquí — VarianteProducto.talla
            # y .color son NOT NULL DEFAULT '', así que agrupar con None
            # haría que las consultas SQL de descuento/restauración (que
            # comparan contra la variante real) no encuentren ninguna fila.
            talla = (item.talla or "") if producto.tallas_lista else ""
            color = (item.color or "") if producto.colores_lista else ""
            clave = (item.producto_id, talla, color)
        else:
            clave = (item.producto_id, "", "")

        grupos[clave] = grupos.get(clave, 0) + item.cantidad

    return grupos, productos_cache


def validar_stock_disponible(grupos, productos_cache):
    """
    Revisa (sin modificar nada) si hay stock suficiente para cada grupo.
    Devuelve un mensaje de error si falta stock en alguno, o None si todo bien.
    """
    for (producto_id, talla, color), cantidad_pedida in grupos.items():
        producto = productos_cache.get(producto_id)
        if not producto:
            return "Uno de los productos de tu carrito ya no existe"

        if producto.usa_variantes:
            variante = producto.variante_para(talla, color)
            disponible = variante.stock if variante else 0
        else:
            disponible = producto.stock

        if cantidad_pedida > disponible:
            return f"Stock insuficiente para {producto.nombre} (disponible: {disponible})"

    return None


def _describir_variante(talla, color):
    partes = [p for p in (f"talla {talla}" if talla else None, color or None) if p]
    return " en " + " y ".join(partes) if partes else ""


def validar_stock_disponible_items(items, grupos=None, productos_cache=None):
    """
    Como validar_stock_disponible, pero pensada para el checkout: en vez de
    devolver solo el primer error como un string genérico, revisa CADA
    ítem del carrito por separado y devuelve una lista con el detalle de
    todos los que se quedaron sin stock suficiente (puede haber más de
    uno). Cada problema trae el id del ItemCarrito afectado, para que el
    frontend pueda señalarlo junto al producto exacto en vez de mostrar un
    error genérico de servidor.

    grupos/productos_cache se pueden pasar ya calculados (de
    agrupar_por_producto) para no repetir esa consulta; si no se pasan, se
    calculan acá.

    Devuelve una lista de dicts (vacía si todo está bien):
      {item_id, producto_id, producto_nombre, talla, color,
       disponible, pedido, mensaje}
    """
    if grupos is None or productos_cache is None:
        grupos, productos_cache = agrupar_por_producto(items)

    disponibilidad_por_grupo = {}
    for (producto_id, talla, color) in grupos:
        producto = productos_cache.get(producto_id)
        if not producto:
            disponibilidad_por_grupo[(producto_id, talla, color)] = 0
            continue
        if producto.usa_variantes:
            variante = producto.variante_para(talla, color)
            disponibilidad_por_grupo[(producto_id, talla, color)] = variante.stock if variante else 0
        else:
            disponibilidad_por_grupo[(producto_id, talla, color)] = producto.stock

    problemas = []
    for item in items:
        producto = productos_cache.get(item.producto_id)

        if not producto:
            problemas.append({
                "item_id": item.id,
                "producto_id": item.producto_id,
                "producto_nombre": None,
                "talla": item.talla,
                "color": item.color,
                "disponible": 0,
                "pedido": item.cantidad,
                "mensaje": "Uno de los productos de tu carrito ya no existe.",
            })
            continue

        if producto.usa_variantes:
            talla = (item.talla or "") if producto.tallas_lista else ""
            color = (item.color or "") if producto.colores_lista else ""
        else:
            talla, color = "", ""
        clave = (item.producto_id, talla, color)

        # Cuánto pide el GRUPO en total (normalmente coincide con este ítem
        # solo, ya que agregar_item() fusiona cantidades repetidas de la
        # misma combinación producto+talla+color en un único ItemCarrito).
        cantidad_grupo = grupos.get(clave, item.cantidad)
        disponible = disponibilidad_por_grupo.get(clave, 0)

        if cantidad_grupo > disponible:
            detalle_variante = _describir_variante(talla, color) if producto.usa_variantes else ""
            if disponible <= 0:
                mensaje = f"Ya no queda{detalle_variante} de {producto.nombre}."
            else:
                mensaje = f"Solo quedan {disponible} unidades{detalle_variante} de {producto.nombre}."
            problemas.append({
                "item_id": item.id,
                "producto_id": item.producto_id,
                "producto_nombre": producto.nombre,
                "talla": item.talla,
                "color": item.color,
                "disponible": disponible,
                "pedido": item.cantidad,
                "mensaje": mensaje,
            })

    return problemas


def descontar_stock(grupos, productos_cache):
    """
    Descuenta stock de forma ATÓMICA (a nivel de base de datos): cada UPDATE
    solo aplica si en ese instante sigue habiendo stock suficiente, evitando
    sobreventa si dos compras del mismo producto llegan casi al mismo tiempo.
    Devuelve un mensaje de error si alguna falló (y esa parte no se aplica),
    o None si todo se descontó correctamente.
    """
    for (producto_id, talla, color), cantidad in grupos.items():
        producto = productos_cache.get(producto_id)

        if producto and producto.usa_variantes:
            resultado = db.session.execute(
                text(
                    "UPDATE variantes_producto SET stock = stock - :cantidad "
                    "WHERE producto_id = :pid AND talla = :talla AND color = :color "
                    "AND stock >= :cantidad"
                ),
                {"cantidad": cantidad, "pid": producto_id, "talla": talla, "color": color},
            )
        else:
            resultado = db.session.execute(
                text(
                    "UPDATE productos SET stock = stock - :cantidad "
                    "WHERE id = :pid AND stock >= :cantidad"
                ),
                {"cantidad": cantidad, "pid": producto_id},
            )

        if resultado.rowcount == 0:
            nombre = producto.nombre if producto else "un producto de tu carrito"
            return f"'{nombre}' se quedó sin stock justo ahora. Actualiza tu carrito e intenta de nuevo."

    return None


def restaurar_stock_de_pedido(pedido):
    """
    Devuelve al stock las cantidades de un pedido (al cancelarlo).

    Usa detalle.variante_id (referencia histórica directa) cuando está
    disponible — es la forma correcta y a prueba de que la variante haya
    cambiado o se haya borrado después del pedido. Para detalles antiguos
    que no tengan variante_id (pedidos creados antes de esta corrección),
    cae de vuelta a buscar por producto_id + talla + color, igual que antes.
    """
    detalles = pedido.detalles.all()

    con_variante_id = [d for d in detalles if d.variante_id is not None]
    sin_variante_id = [d for d in detalles if d.variante_id is None]

    # Camino preferido: variante_id directo.
    totales_por_variante = {}
    for d in con_variante_id:
        totales_por_variante[d.variante_id] = totales_por_variante.get(d.variante_id, 0) + d.cantidad

    for variante_id, cantidad in totales_por_variante.items():
        db.session.execute(
            text("UPDATE variantes_producto SET stock = stock + :cantidad WHERE id = :vid"),
            {"cantidad": cantidad, "vid": variante_id},
        )

    # Camino de respaldo: detalles antiguos sin variante_id, o productos sin
    # variantes (variante_id siempre es None ahí, se restauran por producto_id).
    if sin_variante_id:
        grupos, productos_cache = agrupar_por_producto(sin_variante_id)
        for (producto_id, talla, color), cantidad in grupos.items():
            producto = productos_cache.get(producto_id)
            if not producto:
                continue  # el producto pudo haber sido borrado; no hay a dónde devolver stock

            if producto.usa_variantes:
                db.session.execute(
                    text(
                        "UPDATE variantes_producto SET stock = stock + :cantidad "
                        "WHERE producto_id = :pid AND talla = :talla AND color = :color"
                    ),
                    {"cantidad": cantidad, "pid": producto_id, "talla": talla, "color": color},
                )
            else:
                db.session.execute(
                    text("UPDATE productos SET stock = stock + :cantidad WHERE id = :pid"),
                    {"cantidad": cantidad, "pid": producto_id},
                )
