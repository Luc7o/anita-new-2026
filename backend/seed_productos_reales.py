"""
Carga los productos reales de la tienda SIN imágenes (las subes tú desde el
panel admin: Productos > editar > imágenes, por color).

Uso (desde la carpeta backend, con el .env cargado, igual que seed.py):
    python seed_productos_reales.py

- Necesita que existan las categorías (corre antes `python seed.py`).
- Se puede correr varias veces: si un SKU ya existe, ese producto se salta.
- Los PRECIOS, TALLAS Y STOCK son de ejemplo: ajústalos abajo o desde el panel.
"""
from app import create_app
from app.extensions import db
from app.models import Categoria, Producto, VarianteProducto

app = create_app()

TALLAS_SANDALIA = ["35", "36", "37", "38", "39"]
TALLAS_PANTUFLA = ["26", "27", "28", "29", "30"]

# colores: nombres como los espera el catálogo (utils/colores.py).
PRODUCTOS = [
    {
        "sku": "ANS-R001", "categoria": "carteras", "genero": "mujer",
        "nombre": "Cartera Hobo Floral con Borla",
        "descripcion": "Cartera hobo de hombro en cuero sintético texturizado, con relieve floral, "
                       "borla decorativa, herrajes dorados y bolsillo exterior con cierre.",
        "precio": 89.90, "oferta": None, "destacado": True, "nuevo": True,
        "tallas": [], "stock": 18, "colores": ["Vino", "Negro", "Beige"],
    },
    {
        "sku": "ANS-R002", "categoria": "calzados", "genero": "nina",
        "nombre": "Pantuflas Peluche Pingüino Niña",
        "descripcion": "Pantuflas de peluche suave con diseño de pingüino y lazo, suela antideslizante "
                       "de goma. Abrigadas y cómodas para casa.",
        "precio": 39.90, "oferta": 34.90, "destacado": False, "nuevo": True,
        "tallas": TALLAS_PANTUFLA, "stock": 25, "colores": ["Rosa"],
    },
    {
        "sku": "ANS-R003", "categoria": "mochilas", "genero": "mujer",
        "nombre": "Mochila Urbana Cuero Marrón",
        "descripcion": "Mochila urbana en cuero sintético con múltiples compartimentos, bolsillos con "
                       "cierre, correas ajustables y asa superior.",
        "precio": 119.90, "oferta": None, "destacado": True, "nuevo": False,
        "tallas": [], "stock": 10, "colores": ["Marrón"],
    },
    {
        "sku": "ANS-R004", "categoria": "calzados", "genero": "mujer",
        "nombre": "Sandalias Plataforma Strass",
        "descripcion": "Sandalias de plataforma y taco ancho con tiras de strass y pulsera al tobillo "
                       "con hebilla. Ideales para fiestas y ocasiones especiales.",
        "precio": 149.90, "oferta": 129.90, "destacado": True, "nuevo": True,
        "tallas": TALLAS_SANDALIA, "stock": 40,
        "colores": ["Crema", "Plateado", "Dorado", "Blanco"],
    },
    {
        "sku": "ANS-R005", "categoria": "carteras", "genero": "mujer",
        "nombre": "Cartera Charol Rosa",
        "descripcion": "Cartera estructurada de charol brillante con doble asa, herrajes dorados y "
                       "amplio interior. Un clásico para el día a día.",
        "precio": 99.90, "oferta": None, "destacado": False, "nuevo": True,
        "tallas": [], "stock": 8, "colores": ["Rosa"],
    },
    {
        "sku": "ANS-R006", "categoria": "carteras", "genero": "mujer",
        "nombre": "Cartera Domo Roja",
        "descripcion": "Cartera tipo domo con doble asa y correa larga desmontable, cierre superior y "
                       "bolsillo trasero con cierre. Herrajes dorados.",
        "precio": 129.90, "oferta": 109.90, "destacado": False, "nuevo": False,
        "tallas": [], "stock": 7, "colores": ["Rojo"],
    },
]


def crear_variantes(producto, tallas, colores, stock_total):
    """Reparte el stock entre todas las combinaciones talla x color."""
    combinaciones = [(t, c) for c in colores for t in (tallas or [""])]
    base, resto = divmod(stock_total, len(combinaciones))
    for i, (talla, color) in enumerate(combinaciones):
        variante = VarianteProducto(stock=base + (1 if i < resto else 0))
        variante.talla = talla
        variante.color = color
        producto.variantes.append(variante)


def seed():
    with app.app_context():
        categorias = {c.slug: c for c in Categoria.query.all()}
        if not categorias:
            print("❌ No hay categorías. Corre primero: python seed.py")
            return

        creados = 0
        for datos in PRODUCTOS:
            if Producto.query.filter_by(sku=datos["sku"]).first():
                print(f"· {datos['nombre']}: ya existe, se salta.")
                continue

            producto = Producto(
                nombre=datos["nombre"], descripcion=datos["descripcion"],
                precio=datos["precio"], precio_oferta=datos["oferta"], sku=datos["sku"],
                categoria_id=categorias[datos["categoria"]].id, genero=datos["genero"],
                destacado=datos["destacado"], es_nuevo=datos["nuevo"],
            )
            # El stock vive en las variantes (talla x color).
            producto.stock = 0
            crear_variantes(producto, datos["tallas"], datos["colores"], datos["stock"])
            db.session.add(producto)
            db.session.commit()
            creados += 1
            print(f"✅ {datos['nombre']}")

        print(f"Listo: {creados} productos creados.")


if __name__ == "__main__":
    seed()
