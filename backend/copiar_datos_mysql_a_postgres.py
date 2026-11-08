"""
Copia los datos de la base MySQL (la que usabas hasta ahora) a la base PostgreSQL nueva.

Antes de correrlo:
  1. La base PostgreSQL ya debe tener el esquema:   python aplicar_migraciones.py
  2. Instala el driver de MySQL solo para este paso:  pip install pymysql
  3. DATABASE_URL debe apuntar a la base PostgreSQL (la nueva).

Uso (solo el catálogo: categorías, tallas, colores, proveedores, productos con sus variantes
e imágenes, promociones y la configuración de la tienda):
    python copiar_datos_mysql_a_postgres.py --origen "mysql+pymysql://usuario:clave@host:puerto/base"

Para copiar TODO (también usuarios, pedidos, compras, kardex, reseñas, etc.), agrega --todo.
El ubigeo no se copia (ya viene sembrado) ni los registros de latencia y analítica.

Si la base nueva ya tiene datos en las tablas a copiar (aparte de lo sembrado por las
migraciones), el script se detiene. Agrega --reemplazar para borrarlos y copiar de nuevo.
"""
import argparse
import json
import os
import re
import sys

from sqlalchemy import Boolean, MetaData, create_engine, text
from sqlalchemy.dialects.postgresql import JSONB

CATALOGO = {
    "categorias", "tallas", "colores", "proveedores", "productos", "variantes_producto",
    "imagenes_producto", "proveedor_productos", "promociones", "configuracion_tienda",
}
SIEMPRE_FUERA = {
    "migraciones_aplicadas", "ubigeo_departamentos", "ubigeo_provincias", "ubigeo_distritos",
    "latencia_requests", "evento_analitica",
}
# Tablas que las migraciones ya dejaron con datos base: se reemplazan por las del origen
SEMBRADAS = {"roles", "tallas", "colores", "configuracion_tienda"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--origen", required=True, help="URL de la base MySQL de origen")
    ap.add_argument("--todo", action="store_true", help="copiar todas las tablas, no solo el catálogo")
    ap.add_argument("--reemplazar", action="store_true", help="borrar lo que haya en las tablas a copiar")
    args = ap.parse_args()

    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        sys.exit("Falta DATABASE_URL (la URL de la base PostgreSQL nueva).")
    destino = create_engine(re.sub(r"^postgres(ql)?://", "postgresql+psycopg2://", url))
    origen = create_engine(args.origen)

    meta = MetaData()
    meta.reflect(destino)
    tablas = [t for t in meta.sorted_tables if t.name not in SIEMPRE_FUERA]
    if not args.todo:
        tablas = [t for t in tablas if t.name in CATALOGO]
    nombres = {t.name for t in tablas}

    with destino.begin() as dst, origen.connect() as src:
        for t in tablas:
            ocupadas = dst.execute(text(f"SELECT count(*) FROM {t.name}")).scalar()
            if ocupadas and t.name not in SEMBRADAS and not args.reemplazar:
                sys.exit(f"La tabla {t.name} ya tiene {ocupadas} filas. Usa --reemplazar para borrarlas y copiar de nuevo.")
        # Si el origen no tiene filas en una tabla sembrada (por ejemplo, la configuración de
        # la tienda), se conserva lo que sembraron las migraciones en vez de dejarla vacía.
        conservar = set()
        for t in tablas:
            if t.name in SEMBRADAS:
                try:
                    if not src.execute(text(f"SELECT 1 FROM {t.name} LIMIT 1")).first():
                        conservar.add(t.name)
                except Exception:
                    conservar.add(t.name)
        for t in reversed(tablas):
            if t.name not in conservar:
                dst.execute(text(f"DELETE FROM {t.name}"))

        print(f"{'tabla':28} {'origen':>8} {'destino':>8}")
        for t in tablas:
            if t.name in conservar:
                print(f"{t.name:28} (origen vacío: se conserva lo sembrado)")
                continue
            try:
                filas = src.execute(text(f"SELECT * FROM {t.name}")).mappings().all()
            except Exception:
                print(f"{t.name:28} (no existe en el origen, se omite)")
                continue
            columnas = [c for c in t.columns if c.name in (filas[0].keys() if filas else [])]
            lote = []
            for f in filas:
                reg = {}
                for c in columnas:
                    v = f[c.name]
                    if v is not None and isinstance(c.type, Boolean):
                        v = bool(v)
                    elif v is not None and isinstance(c.type, JSONB) and not isinstance(v, str):
                        v = json.dumps(v)
                    reg[c.name] = v
                lote.append(reg)
            for i in range(0, len(lote), 500):
                dst.execute(t.insert(), lote[i:i + 500])
            print(f"{t.name:28} {len(filas):>8} {dst.execute(text(f'SELECT count(*) FROM {t.name}')).scalar():>8}")

        # Los ids se copiaron tal cual: se acomoda el contador para que los siguientes no choquen
        for t in tablas:
            if "id" in t.columns:
                dst.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{t.name}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {t.name}), 1), (SELECT MAX(id) IS NOT NULL FROM {t.name})) "
                    f"WHERE pg_get_serial_sequence('{t.name}', 'id') IS NOT NULL"
                ))
    print("\n✅ Datos copiados.")


if __name__ == "__main__":
    main()
