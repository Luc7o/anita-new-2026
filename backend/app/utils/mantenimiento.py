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
# Un consentimiento "aceptado" se vuelve a pedir a los 12 meses (lo hace el banner); el registro con
# su identificador se borra poco después si la persona no volvió a confirmar.
DIAS_CONSENTIMIENTO_ACEPTADO = 400

LOTE = 5000                 # filas por DELETE, para no bloquear la tabla mucho rato
PRESUPUESTO_SEGUNDOS = 6    # la función serverless tiene un tiempo máximo corto


def _borrar_en_lotes(tabla, columna_fecha, limite, inicio, condicion_extra=""):
    """Borra lo viejo de una tabla en tandas (ctid + LIMIT en una subconsulta, porque
    PostgreSQL no admite DELETE ... LIMIT) hasta vaciarlo o agotar el tiempo."""
    sql = (
        f"DELETE FROM {tabla} WHERE ctid IN ("
        f"SELECT ctid FROM {tabla} WHERE {columna_fecha} < :limite {condicion_extra} LIMIT {LOTE})"
    )
    total = 0
    while time.monotonic() - inicio < PRESUPUESTO_SEGUNDOS:
        resultado = db.session.execute(text(sql), {"limite": limite})
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
            "latencia_requests", "fecha_creacion", ahora - timedelta(days=DIAS_LATENCIA), inicio,
        ),
        "evento_analitica": _borrar_en_lotes(
            "evento_analitica", "creado_en", ahora - timedelta(days=DIAS_EVENTOS), inicio,
        ),
        "tokens_recuperacion": _borrar_en_lotes(
            "tokens_recuperacion", "expira_en", ahora - timedelta(days=DIAS_TOKENS_RECUPERACION), inicio,
        ),
        "consentimientos_vencidos": _borrar_en_lotes(
            "consentimientos_privacidad", "decidido_en",
            ahora - timedelta(days=DIAS_CONSENTIMIENTO_ACEPTADO), inicio,
            condicion_extra="AND decision = 'aceptado'",
        ),
    }