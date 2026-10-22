"""
Limpieza periódica de tablas que crecen sin parar y que solo sirven para
mirar lo reciente (métricas del panel). Se ejecuta desde el cron diario.
"""
import time
from datetime import datetime, timedelta

from sqlalchemy import text

from app.extensions import db

# Cuánto tiempo se conserva cada cosa. El dashboard solo mira las últimas 24 h
# de latencia y hasta 30 días de visitas, así que hay margen de sobra.
DIAS_LATENCIA = 30
DIAS_EVENTOS = 180
DIAS_TOKENS_RECUPERACION = 7

LOTE = 5000                 # filas por DELETE, para no bloquear la tabla mucho rato
PRESUPUESTO_SEGUNDOS = 6    # la función serverless tiene un tiempo máximo corto


def _borrar_en_lotes(sql, parametros, inicio):
    """Ejecuta un DELETE ... LIMIT repetido hasta vaciar lo viejo o agotar el tiempo."""
    total = 0
    while time.monotonic() - inicio < PRESUPUESTO_SEGUNDOS:
        resultado = db.session.execute(text(sql + f" LIMIT {LOTE}"), parametros)
        db.session.commit()
        total += resultado.rowcount
        if resultado.rowcount < LOTE:
            break
    return total


def purgar_metricas_antiguas(ahora=None):
    """Devuelve cuántas filas se borraron de cada tabla. Lo que no alcance a
    borrarse en esta pasada (por el límite de tiempo) se borra en la siguiente."""
    ahora = ahora or datetime.utcnow()
    inicio = time.monotonic()
    return {
        "latencia_requests": _borrar_en_lotes(
            "DELETE FROM latencia_requests WHERE fecha_creacion < :limite",
            {"limite": ahora - timedelta(days=DIAS_LATENCIA)}, inicio,
        ),
        "evento_analitica": _borrar_en_lotes(
            "DELETE FROM evento_analitica WHERE creado_en < :limite",
            {"limite": ahora - timedelta(days=DIAS_EVENTOS)}, inicio,
        ),
        "tokens_recuperacion": _borrar_en_lotes(
            "DELETE FROM tokens_recuperacion WHERE expira_en < :limite",
            {"limite": ahora - timedelta(days=DIAS_TOKENS_RECUPERACION)}, inicio,
        ),
    }
