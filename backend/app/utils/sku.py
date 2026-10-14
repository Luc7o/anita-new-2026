"""
Generación automática de SKU para productos.

Formato: PREFIJO-000123
  - PREFIJO: 3 primeras letras de la categoría (sin tildes, en mayúsculas).
  - 000123: el id del producto con ceros a la izquierda.

Por qué es seguro ante dos administradores creando a la vez: el id lo asigna
la base de datos (AUTO_INCREMENT) y nunca se repite, así que dos productos
nuevos no pueden recibir el mismo número. Además la columna `productos.sku`
tiene UNIQUE en la base, que es la última barrera si algo llegara a chocar.

El único choque posible es con un SKU escrito a mano antes de este cambio
que casualmente tenga el mismo formato; en ese caso se agrega un sufijo
(-2, -3, ...) en vez de fallar.

Cada variante (talla/color) tiene además su propio SKU, que se arma con el
del producto: VES-000123-M-ROJ (talla M, color Rojo). Se guarda en
variantes_producto.sku. Como al guardar un producto sus variantes se borran y
se vuelven a crear (ids nuevos), el SKU no se basa en el id de la variante:
se conserva el que ya tenía la misma combinación talla+color y solo se genera
uno nuevo para combinaciones nuevas. Un producto sin tallas ni colores no usa
variantes y su único SKU es el del producto.
"""
import re
import unicodedata

from app.extensions import db
from app.models import Producto, VarianteProducto

PREFIJO_POR_DEFECTO = "PRD"


def prefijo_categoria(nombre):
    sin_tildes = unicodedata.normalize("NFKD", nombre or "").encode("ascii", "ignore").decode()
    letras = re.sub(r"[^A-Za-z]", "", sin_tildes).upper()
    return letras[:3] if len(letras) >= 2 else PREFIJO_POR_DEFECTO


def generar_sku(producto):
    """Calcula el SKU para un producto que ya tiene id (después de flush)."""
    nombre_cat = producto.categoria.nombre if producto.categoria else ""
    base = f"{prefijo_categoria(nombre_cat)}-{producto.id:06d}"
    candidato, n = base, 1
    while Producto.query.filter(Producto.sku == candidato, Producto.id != producto.id).first():
        n += 1
        candidato = f"{base}-{n}"
    return candidato


def asignar_sku_si_falta(producto):
    """Respeta el SKU que ya tenga el producto; solo genera si está vacío."""
    if not (producto.sku or "").strip():
        producto.sku = generar_sku(producto)


# --------------------------------------------------------------------------
# SKU por variante (talla / color)
# --------------------------------------------------------------------------

def _alfanumerico(texto):
    sin_tildes = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]", "", sin_tildes).upper()


def codigo_talla(nombre):
    """'M' -> 'M', 'XL' -> 'XL', '38' -> '38', 'Talla única' -> 'TALLAU'."""
    return _alfanumerico(nombre)[:6]


def codigo_color(nombre):
    """'Rojo' -> 'ROJ', 'Azul marino' -> 'AZU'."""
    return _alfanumerico(nombre)[:3]


def sku_variante_base(sku_producto, talla, color):
    partes = [sku_producto]
    for codigo in (codigo_talla(talla), codigo_color(color)):
        if codigo:
            partes.append(codigo)
    return "-".join(partes)


def _sku_variante_libre(base, usados, producto_id):
    """Primer candidato (base, base-2, base-3...) que no esté en uso: ni por
    otra variante de este producto (usados) ni por ninguna otra de la base."""
    candidato, n = base, 1
    while (
        candidato in usados
        or VarianteProducto.query.filter(
            VarianteProducto.sku == candidato, VarianteProducto.producto_id != producto_id
        ).first()
    ):
        n += 1
        candidato = f"{base}-{n}"
    return candidato


def asignar_skus_variantes(producto):
    """Completa el SKU de las variantes del producto que no lo tengan.
    Respeta los que ya existen. Requiere que producto.sku ya esté asignado."""
    if not (producto.sku or "").strip():
        return
    variantes = VarianteProducto.query.filter_by(producto_id=producto.id).all()
    usados = {v.sku for v in variantes if v.sku}
    for v in sorted(variantes, key=lambda x: (x.talla or "", x.color or "")):
        if (v.sku or "").strip():
            continue
        v.sku = _sku_variante_libre(
            sku_variante_base(producto.sku, v.talla, v.color), usados, producto.id
        )
        usados.add(v.sku)
    db.session.flush()
