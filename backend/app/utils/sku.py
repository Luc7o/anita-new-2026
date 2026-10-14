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

El SKU es del producto, no de cada variante (talla/color): las variantes
solo llevan stock, no tienen columna de SKU propia.
"""
import re
import unicodedata

from app.models import Producto

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
