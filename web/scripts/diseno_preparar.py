"""
Prepara la base LOCAL del entorno de diseño (anita_diseno): migraciones, catálogo de
prueba con pedidos, reseñas y visitas (backend/seed.py), los productos de la tienda
(backend/seed_productos_reales.py), fotos de prueba guardadas en web/public/fotos-prueba,
promociones de ejemplo con imágenes SIN FONDO para el carrusel de la portada y dos
cuentas para entrar:

    cliente@diseno.test / Diseno-2026!   (cliente)
    admin@diseno.test   / Diseno-2026!   (superadmin, para el panel)

Solo toca la base local (entorno.py rechaza cualquier otra). Se puede correr de nuevo:
lo que ya existe se salta.

Uso (desde web/):  npm run diseno:preparar
"""
import os
import runpy
import sys

os.environ.setdefault("E2E_DATABASE_URL", "postgresql://postgres:test@localhost:54329/anita_diseno")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "e2e", "servidor"))

from entorno import BACKEND  # noqa: E402  (configura el entorno y valida que la base sea local)

WEB = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CLAVE = "Diseno-2026!"


def correr(script, *argumentos):
    print(f"\n== {script} {' '.join(argumentos)}")
    anterior = sys.argv
    sys.argv = [script, *argumentos]
    try:
        runpy.run_path(os.path.join(BACKEND, script), run_name="__main__")
    except SystemExit as e:
        if e.code not in (None, 0):
            raise
    finally:
        sys.argv = anterior


# Promociones de ejemplo del carrusel: (nombre del producto, etiqueta, título, descripción).
PROMOS = [
    ("Cartera Domo Roja", "Nuevo esta semana", "La cartera que lo cambia todo", "Charol rojo, forma domo y asa corta. Para el día y para la noche."),
    ("Mochila Urbana Cuero Marrón", "Vuelta a la rutina", "Lleva tu día contigo", "Cuero marrón con bolsillo frontal y espacio para tu laptop."),
    ("Botines Cuero Negro", "Temporada de lluvia", "Pisa fuerte en Huancayo", "Botines de cuero con suela antideslizante."),
    ("Sandalias Plataforma Strass", "Oferta", "Brilla en cada paso", "Plataforma cómoda con detalles de strass."),
]


def promociones_de_ejemplo():
    """Crea las promociones de ejemplo (si no existen) con un recorte sin fondo de su producto."""
    import uuid

    from app import create_app
    from app.extensions import db
    from app.models import Producto, Promocion

    sys.path.insert(0, BACKEND)
    import cargar_fotos_prueba as fotos

    carpeta = os.path.join(WEB, "public", "fotos-prueba")
    os.makedirs(carpeta, exist_ok=True)
    app = create_app()
    with app.app_context():
        for orden, (nombre, etiqueta, titulo, descripcion) in enumerate(PROMOS):
            if Promocion.query.filter_by(titulo=titulo).first():
                continue
            producto = Producto.query.filter_by(nombre=nombre).first()
            if not producto:
                print(f"  (no existe {nombre}: se salta)")
                continue
            color = fotos.plan_de_fotos(producto)[0][2]
            archivo = f"recorte-{uuid.uuid4().hex}.png"
            with open(os.path.join(carpeta, archivo), "wb") as f:
                f.write(fotos.dibujar_recorte(fotos.tipo_de(producto), color))
            db.session.add(Promocion(
                etiqueta=etiqueta, titulo=titulo, descripcion=descripcion,
                imagen_url=f"/fotos-prueba/{archivo}", boton_texto="Ver producto",
                boton_link=f"/producto/{producto.id}", producto_id=producto.id, activo=True, orden=orden,
            ))
            print(f"  OK promoción: {titulo}")
        db.session.commit()


def main():
    os.chdir(BACKEND)
    correr("aplicar_migraciones.py")
    correr("seed.py", "--si")
    correr("seed_productos_reales.py")
    correr("crear_admin.py", "admin@diseno.test", CLAVE, "Admin", "Diseño", "superadmin")
    correr("crear_admin.py", "cliente@diseno.test", CLAVE, "Ana", "Diseño", "cliente")
    correr("cargar_fotos_prueba.py", "--guardar-en", os.path.join(WEB, "public", "fotos-prueba"), "--url-base", "/fotos-prueba")
    print("\n== promociones de ejemplo (carrusel)")
    promociones_de_ejemplo()
    print("\nListo. Levanta el entorno con: npm run diseno")


if __name__ == "__main__":
    main()
