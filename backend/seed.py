"""
Pobla la base de datos con categorías y productos de ejemplo.

IMPORTANTE: este script YA NO crea el esquema (no usa db.create_all()).
Antes de correrlo, tienes que tener las tablas creadas, corriendo:
    python aplicar_migraciones.py
(eso incluye 000_esquema_base.sql, que crea todo desde cero si tu base
está vacía, y no hace nada si ya existen las tablas).

Las tallas y colores ya no son texto en Producto: viven en el catálogo
(tablas tallas / colores) y cada combinación talla+color es una fila de
variantes_producto con su propio stock. Este script crea esas variantes.

Uso:
    python seed.py
"""
from sqlalchemy import inspect
from app import create_app
from app.extensions import db
from app.models import Categoria, Producto, VarianteProducto

app = create_app()

# (categoria_slug, nombre, precio, precio_oferta, stock_total, tallas, colores)
PRODUCTOS_DEMO = [
    ("calzados", "Botines Charol Negro", 189.90, None, 12, ["35", "36", "37", "38"], ["Negro"]),
    ("calzados", "Sandalias Trenzadas Beige", 129.90, 99.90, 8, ["35", "36", "37"], ["Beige", "Camel"]),
    ("vestidos", "Vestido Midi Satinado", 219.00, None, 10, ["S", "M", "L"], ["Vino", "Negro"]),
    ("vestidos", "Vestido Lino Oversize", 159.90, 139.90, 15, ["S", "M", "L", "XL"], ["Crudo"]),
    ("carteras", "Cartera Mini Bag Cuero", 249.00, None, 6, [], ["Camel", "Negro"]),
    ("carteras", "Clutch Noche Bordada", 179.90, None, 5, [], ["Dorado"]),
    ("mochilas", "Mochila Urbana Acolchada", 159.00, 129.00, 14, [], ["Negro", "Gris"]),
    ("mochilas", "Mochila Mini Croissant", 139.90, None, 9, [], ["Beige"]),
    ("accesorios", "Set Aretes Perla Barroca", 69.90, None, 20, [], ["Perla"]),
    ("accesorios", "Cinturón Trenzado Ancho", 79.90, 59.90, 11, ["Único"], ["Marrón"]),
]


def _crear_variantes(producto, stock_total, tallas, colores):
    """Reparte el stock total entre todas las combinaciones talla x color.

    Si un eje no aplica (sin tallas o sin colores) se usa '' (el registro
    placeholder del catálogo), nunca NULL, igual que hace el panel admin.
    """
    combinaciones = [(t, c) for t in (tallas or [""]) for c in (colores or [""])]
    base, resto = divmod(stock_total, len(combinaciones))
    for i, (talla, color) in enumerate(combinaciones):
        variante = VarianteProducto(stock=base + (1 if i < resto else 0))
        variante.talla = talla   # el setter busca/crea la talla en el catálogo
        variante.color = color   # idem para el color
        producto.variantes.append(variante)


def seed():
    with app.app_context():
        inspector = inspect(db.engine)
        if "productos" not in inspector.get_table_names():
            print("❌ Todavía no existen las tablas en tu base de datos.")
            print("   Corre primero: python aplicar_migraciones.py")
            return

        categorias_map = {}
        for nombre, slug, icono in Categoria.CATEGORIAS_DEFAULT:
            cat = Categoria.query.filter_by(slug=slug).first()
            if not cat:
                cat = Categoria(nombre=nombre, slug=slug, icono=icono)
                db.session.add(cat)
                db.session.flush()
            categorias_map[slug] = cat

        if Producto.query.count() == 0:
            for i, (slug, nombre, precio, oferta, stock, tallas, colores) in enumerate(PRODUCTOS_DEMO):
                producto = Producto(
                    nombre=nombre,
                    descripcion=f"{nombre} — pieza seleccionada de la colección Anita New Style.",
                    precio=precio,
                    precio_oferta=oferta,
                    sku=f"ANS-{i+1:04d}",
                    categoria_id=categorias_map[slug].id,
                    destacado=(i % 3 == 0),
                    es_nuevo=(i % 2 == 0),
                    imagen_url="",
                )
                if tallas or colores:
                    # Con variantes, el stock real vive en cada variante.
                    producto.stock = 0
                    _crear_variantes(producto, stock, tallas, colores)
                else:
                    producto.stock = stock
                db.session.add(producto)

        db.session.commit()
        print("✅ Base de datos poblada con categorías y productos de ejemplo.")


if __name__ == "__main__":
    seed()
