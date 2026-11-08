"""
Aplica las migraciones SQL pendientes de backend/migraciones_postgres/ (PostgreSQL).

Uso (desde la carpeta backend, con la variable DATABASE_URL apuntando a la base):
    python aplicar_migraciones.py

Cómo funciona:
- Cada archivo .sql se ejecuta COMPLETO dentro de una sola transacción: si algo falla,
  se deshace todo el archivo y la base queda como estaba (PostgreSQL permite esto
  incluso con CREATE TABLE y ALTER TABLE).
- Lo que ya se aplicó queda anotado en la tabla migraciones_aplicadas, así que volver
  a correr el script solo aplica lo nuevo.
- Los archivos se aplican en orden por nombre: 001_..., 002_..., 003_...
- Este script usa SOLO la carpeta migraciones_postgres/. La carpeta migraciones/ tiene
  las migraciones antiguas de MySQL: se conservan de referencia y ya no se aplican.
"""
import os
import sys

from app import create_app
from app.extensions import db

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migraciones_postgres")


def main():
    app = create_app()
    with app.app_context():
        conexion = db.engine.raw_connection()
        try:
            cursor = conexion.cursor()
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS migraciones_aplicadas ("
                "nombre_archivo varchar(200) PRIMARY KEY, "
                "fecha_aplicada timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'utc'))"
            )
            conexion.commit()

            cursor.execute("SELECT nombre_archivo FROM migraciones_aplicadas")
            aplicadas = {fila[0] for fila in cursor.fetchall()}
            archivos = sorted(f for f in os.listdir(CARPETA) if f.endswith(".sql"))
            pendientes = [f for f in archivos if f not in aplicadas]

            if not pendientes:
                print("✅ No hay migraciones pendientes, tu base de datos está al día.")
                return 0

            for archivo in pendientes:
                print(f"→ Aplicando {archivo} ...")
                with open(os.path.join(CARPETA, archivo), encoding="utf-8") as f:
                    sql = f.read()
                try:
                    cursor.execute(sql)
                    cursor.execute("INSERT INTO migraciones_aplicadas (nombre_archivo) VALUES (%s)", (archivo,))
                    conexion.commit()
                except Exception as error:
                    conexion.rollback()
                    print(f"  ❌ Error en {archivo}: {error}")
                    print("     Se deshizo todo ese archivo; la base quedó como estaba. Corrige y vuelve a correr.")
                    return 1
                print(f"  ✅ {archivo} aplicada.")

            print(f"\n✅ Listo, se aplicaron {len(pendientes)} migración(es).")
            return 0
        finally:
            conexion.close()


if __name__ == "__main__":
    sys.exit(main())
