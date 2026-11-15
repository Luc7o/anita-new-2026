"""
Borra los datos de PRUEBA de la base y deja solo lo necesario para que la app funcione.

Uso (desde la carpeta backend, con el venv activo y DATABASE_URL apuntando a la base):
    python limpiar_datos_prueba.py            # muestra qué se borraría y pide confirmación
    python limpiar_datos_prueba.py --si       # sin preguntar (para scripts)

SE CONSERVA:
- usuarios y codigos_respaldo (cuentas, roles asignados, 2FA)
- roles, configuracion_tienda y todo el ubigeo (departamentos, provincias, distritos)
- migraciones_aplicadas (historial de migraciones)

SE BORRA TODO LO DEMÁS (y los contadores de id vuelven a 1):
categorías, proveedores, productos, variantes, tallas, colores, imágenes, compras,
pedidos y su historial, pagos, movimientos de stock (kardex), carritos, favoritos,
reseñas, promociones, reclamaciones, tokens de recuperación, analítica y latencia.

Todo corre en UNA transacción: si algo falla, no se borra nada.
Antes de correrlo en producción crea una rama de respaldo en Neon.
Las imágenes ya subidas a Vercel Blob NO se borran (quedan huérfanas, sin costo relevante).
"""
import sys
from urllib.parse import urlparse

from app import create_app
from app.extensions import db

CONSERVAR = {
    "usuarios",
    "codigos_respaldo",
    "roles",
    "configuracion_tienda",
    "ubigeo_departamentos",
    "ubigeo_provincias",
    "ubigeo_distritos",
    "migraciones_aplicadas",
}


def main():
    sin_preguntar = "--si" in sys.argv
    app = create_app()
    with app.app_context():
        conexion = db.engine.raw_connection()
        try:
            cursor = conexion.cursor()
            cursor.execute(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
            )
            existentes = [f[0] for f in cursor.fetchall()]
            a_borrar = [t for t in existentes if t not in CONSERVAR]
            faltantes = sorted(CONSERVAR - set(existentes))
            if "usuarios" in faltantes:
                print("❌ No existe la tabla usuarios: ¿estás apuntando a la base correcta?")
                return 1

            host = urlparse(str(db.engine.url.render_as_string(hide_password=True))).hostname
            print(f"Base de datos: {host}\n")
            print("Se CONSERVAN (filas actuales):")
            for t in sorted(CONSERVAR & set(existentes)):
                cursor.execute(f'SELECT count(*) FROM "{t}"')
                print(f"  {t:28} {cursor.fetchone()[0]:>6}")
            print("\nSe BORRAN (filas actuales):")
            total = 0
            for t in a_borrar:
                cursor.execute(f'SELECT count(*) FROM "{t}"')
                n = cursor.fetchone()[0]
                total += n
                print(f"  {t:28} {n:>6}")
            print(f"\nTotal de filas a borrar: {total}")

            if not sin_preguntar:
                respuesta = input('\nEscribe LIMPIAR para continuar (otra cosa cancela): ').strip()
                if respuesta != "LIMPIAR":
                    print("Cancelado, no se borró nada.")
                    return 0

            lista = ", ".join(f'"{t}"' for t in a_borrar)
            # Sin CASCADE a propósito: si alguna tabla conservada dependiera de una borrada,
            # PostgreSQL rechaza la operación en vez de arrastrar datos que querías guardar.
            cursor.execute(f"TRUNCATE TABLE {lista} RESTART IDENTITY")
            conexion.commit()
            print("\n✅ Listo. Datos de prueba borrados; usuarios y configuración intactos.")
            return 0
        except Exception as error:
            conexion.rollback()
            print(f"\n❌ Error: {error}\nNo se borró nada.")
            return 1
        finally:
            conexion.close()


if __name__ == "__main__":
    sys.exit(main())
