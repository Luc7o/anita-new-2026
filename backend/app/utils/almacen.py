"""
Correcciones de stock hechas a mano desde Almacén: mermas, ajustes puntuales e
inventario físico. Cada cambio queda en el kardex con quién lo hizo y por qué.

Ninguna función hace commit: lo hace quien las llama, así todo se guarda junto
o no se guarda nada.
"""
from sqlalchemy import text

from app.extensions import db
from app.models import MovimientoStock, Producto, VarianteProducto
from app.utils.stock import _stock_actual

MAX_CAMBIO = 1000000


class ErrorAlmacen(Exception):
    """Error de validación o de regla de negocio, con un mensaje apto para mostrar."""

    def __init__(self, mensaje, status=400):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.status = status


def _entero(valor, campo, minimo, maximo):
    try:
        if isinstance(valor, bool) or (isinstance(valor, float) and not valor.is_integer()):
            raise ValueError
        n = int(valor)
    except (TypeError, ValueError):
        raise ErrorAlmacen(f"{campo} no es un número entero válido")
    if n < minimo or n > maximo:
        raise ErrorAlmacen(f"{campo} debe estar entre {minimo} y {maximo}")
    return n


def _nombre(producto, variante):
    if variante:
        partes = [p for p in (f"talla {variante.talla}" if variante.talla else None, variante.color or None) if p]
        if partes:
            return f"{producto.nombre} ({', '.join(partes)})"
    return producto.nombre


def _resolver(producto_id, variante_id, etiqueta="El producto"):
    """Devuelve (producto, variante) validando que la variante exista y pertenezca al producto."""
    pid = _entero(producto_id, etiqueta, 1, 2**31 - 1)
    producto = db.session.get(Producto, pid)
    if not producto:
        raise ErrorAlmacen(f"{etiqueta} no existe")

    if producto.usa_variantes:
        if not variante_id:
            raise ErrorAlmacen(f"Elige talla y color de {producto.nombre}")
        vid = _entero(variante_id, "La variante", 1, 2**31 - 1)
        variante = db.session.get(VarianteProducto, vid)
        if not variante or variante.producto_id != producto.id:
            raise ErrorAlmacen(f"La variante no pertenece a {producto.nombre}")
        return producto, variante
    if variante_id:
        raise ErrorAlmacen(f"{producto.nombre} no maneja tallas ni colores")
    return producto, producto.variante_unica  # producto simple: su única variante


def _aplicar_delta(producto, variante, delta, tipo, usuario_id, motivo):
    """
    Suma `delta` (con signo) al stock de forma atómica y registra el movimiento.
    No deja el stock en negativo. Devuelve el movimiento.
    """
    resultado = db.session.execute(
        text("UPDATE variantes_producto SET stock = stock + :d WHERE id = :id AND stock + :d >= 0"),
        {"d": delta, "id": variante.id},
    )
    if resultado.rowcount == 0:
        actual = _stock_actual(variante.id)
        raise ErrorAlmacen(
            f"No se puede aplicar el cambio de {delta:+d} en {_nombre(producto, variante)}: "
            f"el stock actual es {actual} y no puede quedar en negativo.", status=409,
        )

    stock_despues = _stock_actual(variante.id)
    movimiento = MovimientoStock(
        variante_id=variante.id,
        producto_id=producto.id,
        tipo=tipo,
        cantidad=delta,
        usuario_id=usuario_id,
        motivo=motivo[:255],
        stock_antes=(stock_despues - delta) if stock_despues is not None else None,
        stock_despues=stock_despues,
    )
    db.session.add(movimiento)
    return movimiento


def registrar_ajuste(data, usuario_id):
    """
    Merma o ajuste puntual de una variante (o de un producto sin variantes).
    `cambio` es con signo: negativo saca stock, positivo lo agrega.
    Una merma siempre saca stock. El motivo es obligatorio.
    """
    tipo = data.get("tipo")
    if tipo not in ("merma", "ajuste_manual"):
        raise ErrorAlmacen("Elige si es una merma o un ajuste")

    producto, variante = _resolver(data.get("producto_id"), data.get("variante_id"))

    cambio = _entero(data.get("cambio"), "La cantidad", -MAX_CAMBIO, MAX_CAMBIO)
    if cambio == 0:
        raise ErrorAlmacen("La cantidad no puede ser 0")
    if tipo == "merma" and cambio > 0:
        raise ErrorAlmacen("Una merma siempre saca stock: usa un ajuste si quieres agregar unidades")

    motivo = (str(data.get("motivo") or "")).strip()
    if len(motivo) < 3:
        raise ErrorAlmacen("Escribe el motivo (por ejemplo: producto dañado, se perdió en bodega)")
    if len(motivo) > 200:
        raise ErrorAlmacen("El motivo es demasiado largo (máximo 200 caracteres)")

    return _aplicar_delta(producto, variante, cambio, tipo, usuario_id, motivo)


def aplicar_inventario_fisico(data, usuario_id):
    """
    Aplica el resultado de un conteo físico. Cada línea trae lo que decía el
    sistema cuando se empezó a contar (`esperado`) y lo que se contó (`contado`).

    Se suma la diferencia (contado - esperado) al stock de ahora, en vez de
    pisarlo con lo contado: así las ventas que ocurrieron mientras se contaba
    no se pierden. Las líneas sin diferencia no generan movimiento.

    Devuelve (movimientos, sin_diferencia).
    """
    lineas = data.get("lineas")
    if not isinstance(lineas, list) or not lineas:
        raise ErrorAlmacen("No hay productos contados para aplicar")
    if len(lineas) > 500:
        raise ErrorAlmacen("Aplica el conteo en partes de hasta 500 líneas")

    nota = (str(data.get("nota") or "")).strip()
    if len(nota) > 150:
        raise ErrorAlmacen("La nota es demasiado larga (máximo 150 caracteres)")
    motivo = "Inventario físico" + (f": {nota}" if nota else "")

    preparadas, vistas = [], set()
    for i, raw in enumerate(lineas, start=1):
        if not isinstance(raw, dict):
            raise ErrorAlmacen(f"La línea {i} no es válida")
        producto, variante = _resolver(raw.get("producto_id"), raw.get("variante_id"), etiqueta=f"El producto de la línea {i}")
        clave = (producto.id, variante.id if variante else 0)
        if clave in vistas:
            raise ErrorAlmacen(f"{_nombre(producto, variante)} aparece dos veces en el conteo")
        vistas.add(clave)
        esperado = _entero(raw.get("esperado"), f"El stock del sistema de la línea {i}", 0, MAX_CAMBIO)
        contado = _entero(raw.get("contado"), f"La cantidad contada de la línea {i}", 0, MAX_CAMBIO)
        preparadas.append((clave, producto, variante, contado - esperado))

    # Siempre en el mismo orden, así dos conteos simultáneos no se traban entre sí.
    preparadas.sort(key=lambda x: x[0])

    movimientos, sin_diferencia = [], 0
    for _, producto, variante, diferencia in preparadas:
        if diferencia == 0:
            sin_diferencia += 1
            continue
        movimientos.append(_aplicar_delta(producto, variante, diferencia, "inventario_fisico", usuario_id, motivo))
    db.session.flush()
    return movimientos, sin_diferencia
