"""Ejecuta una sentencia SQL de apoyo en la base E2E (solo local, ver entorno.py)."""
import sys

from entorno import URL_BASE

import psycopg2  # noqa: E402

with psycopg2.connect(URL_BASE) as conexion, conexion.cursor() as cursor:
    cursor.execute(sys.argv[1])
