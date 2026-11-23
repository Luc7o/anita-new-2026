"""
Deja la base E2E en un estado conocido antes de cada prueba:
migraciones aplicadas, datos vaciados y un catálogo mínimo.

    python preparar_base.py            → imprime JSON con lo creado

Las credenciales son de prueba y viven solo en esta base local desechable.
"""
import json
import sys

from entorno import BACKEND  # noqa: F401  (configura el entorno primero)

from sqlalchemy import text  # noqa: E402

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402

CLAVE_CLIENTE = "Clave-E2E-segura-2026"
TABLAS_DE_REFERENCIA = {
    "roles", "tallas", "colores", "configuracion_tienda",
    "ubigeo_departamentos", "ubigeo_provincias", "ubigeo_distritos",
    "migraciones_aplicadas",
}


def main():
    app = create_app()
    with app.app_context():
        import aplicar_migraciones

        if aplicar_migraciones.main() != 0:
            sys.exit("No se pudieron aplicar las migraciones")

        filas = db.session.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'")).all()
        tablas = [f.tablename for f in filas if f.tablename not in TABLAS_DE_REFERENCIA]
        db.session.execute(text("TRUNCATE " + ", ".join(f'"{t}"' for t in tablas) + " RESTART IDENTITY CASCADE"))
        db.session.commit()

        from datetime import datetime

        from app.models import Categoria, Producto, Usuario, VarianteProducto
        from app.utils.legal import VERSION_TERMINOS

        cat = Categoria(nombre="Polos", slug="polos")
        db.session.add(cat)
        db.session.flush()

        def producto(nombre, precio, stock):
            p = Producto(nombre=nombre, precio=precio, categoria_id=cat.id, activo=True,
                         descripcion=f"{nombre} de algodón, para pruebas.")
            db.session.add(p)
            db.session.flush()
            db.session.add(VarianteProducto(producto_id=p.id, stock=stock))
            return p

        normal = producto("Polo E2E básico", 45, 5)
        ultimo = producto("Polo E2E última unidad", 60, 1)

        def cliente(email):
            u = Usuario(nombre="Ana", apellido="Prueba", email=email, activo=True,
                        telefono="987654321", acepto_terminos_en=datetime.utcnow(),
                        version_terminos=VERSION_TERMINOS)
            u.rol = "cliente"
            u.set_password(CLAVE_CLIENTE)
            db.session.add(u)
            return u

        cliente("ana@e2e.test")
        cliente("beto@e2e.test")
        db.session.commit()
        print(json.dumps({
            "producto": normal.id,
            "ultimaUnidad": ultimo.id,
            "clientes": ["ana@e2e.test", "beto@e2e.test"],
            "clave": CLAVE_CLIENTE,
        }))


if __name__ == "__main__":
    main()
