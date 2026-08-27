"""
Aplica las migraciones SQL pendientes de la carpeta migraciones/, en orden,
y lleva registro de cuáles ya se aplicaron para no repetirlas.

Es seguro correrlo tanto en una base de datos NUEVA (000_esquema_base.sql
crea todo desde cero) como en una EXISTENTE que ya tenía tablas creadas por
db.create_all() en versiones anteriores: si una sentencia intenta crear una
columna/tabla/índice que ya existe, se detecta y se OMITE esa sentencia en
vez de abortar toda la migración — así 000 + las incrementales conviven sin
romperse, sin importar cómo haya quedado tu base antes.

Uso:
    python aplicar_migraciones.py
"""
import os
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, IntegrityError, ProgrammingError
from app import create_app
from app.extensions import db

app = create_app()

CARPETA_MIGRACIONES = os.path.join(os.path.dirname(__file__), "migraciones")

# Códigos de error de MySQL que significan "esto ya existe" — se pueden
# ignorar con seguridad porque el resultado final es el mismo que si la
# sentencia se hubiera aplicado.
CODIGOS_YA_EXISTE = {
    1060,  # Duplicate column name
    1050,  # Table already exists
    1061,  # Duplicate key name
    1022,  # Duplicate key (nombre de constraint ya usado)
    1826,  # Duplicate foreign key constraint name
    1068,  # Multiple primary key defined
}

# Respaldo por texto del mensaje: algunos drivers/motores no exponen el
# código numérico de MySQL de forma consistente. Si el código no matchea
# pero el mensaje claramente dice que una ESTRUCTURA (columna/índice/tabla)
# ya existe, lo tratamos igual como seguro de omitir.
#
# OJO: "duplicate entry" (MySQL 1062) NO va en esta lista a propósito.
# Ese error no significa "esto ya existe" — significa que una fila viola
# una restricción UNIQUE con datos que ya están en la tabla (por ejemplo,
# al intentar agregar un UNIQUE sobre una columna que ya tiene duplicados
# reales). Omitir eso en silencio dejaría la restricción SIN aplicarse,
# ocultando un conflicto real de datos en vez de mostrarlo.
FRASES_YA_EXISTE = (
    "duplicate column",
    "duplicate key name",
    "already exists",
    "duplicate foreign key",
)


def _es_error_ya_existe(error):
    codigo = _codigo_mysql(error)
    if codigo in CODIGOS_YA_EXISTE:
        return True
    mensaje = str(error).lower()
    return any(frase in mensaje for frase in FRASES_YA_EXISTE)


def _codigo_mysql(error):
    """Extrae el código de error MySQL de una excepción de SQLAlchemy, si existe."""
    orig = getattr(error, "orig", None)
    if orig is not None and getattr(orig, "args", None):
        primero = orig.args[0]
        if isinstance(primero, int):
            return primero
    return None


def asegurar_tabla_control():
    db.session.execute(text("""
        CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre_archivo VARCHAR(255) UNIQUE NOT NULL,
            fecha_aplicada DATETIME NOT NULL
        )
    """))
    db.session.commit()


def migraciones_ya_aplicadas():
    filas = db.session.execute(text("SELECT nombre_archivo FROM migraciones_aplicadas")).fetchall()
    return {fila[0] for fila in filas}


def aplicar():
    with app.app_context():
        asegurar_tabla_control()
        aplicadas = migraciones_ya_aplicadas()

        archivos = sorted(
            f for f in os.listdir(CARPETA_MIGRACIONES) if f.endswith(".sql")
        )

        pendientes = [f for f in archivos if f not in aplicadas]

        if not pendientes:
            print("✅ No hay migraciones pendientes, tu base de datos está al día.")
            return

        for archivo in pendientes:
            ruta = os.path.join(CARPETA_MIGRACIONES, archivo)
            print(f"→ Aplicando {archivo} ...")
            with open(ruta, "r", encoding="utf-8") as f:
                sql = f.read()

            hubo_error_real = False

            # Permite varias sentencias separadas por ";" en un mismo archivo
            for sentencia in [s.strip() for s in sql.split(";") if s.strip()]:
                try:
                    db.session.execute(text(sentencia))
                except (OperationalError, IntegrityError, ProgrammingError) as e:
                    db.session.rollback()
                    if _es_error_ya_existe(e):
                        print(f"  ⏭  Ya existía (se omite): {sentencia[:70]}...")
                        continue
                    print(f"  ❌ Error real aplicando esta sentencia:\n     {sentencia[:200]}")
                    print(f"  ❌ {e}")
                    hubo_error_real = True
                    break

            if hubo_error_real:
                print(f"\n❌ {archivo} tuvo un error real y NO se marcó como aplicada.")
                print("   Revisa el mensaje de arriba, corrige lo que corresponda y vuelve a correr este script.")
                return

            db.session.execute(
                text("INSERT INTO migraciones_aplicadas (nombre_archivo, fecha_aplicada) VALUES (:n, :f)"),
                {"n": archivo, "f": datetime.utcnow()},
            )
            db.session.commit()
            print(f"  ✅ {archivo} aplicada.")

        print(f"\n✅ Listo, se aplicaron {len(pendientes)} migración(es).")



if __name__ == "__main__":
    aplicar()
