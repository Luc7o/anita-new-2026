"""Utilidades de formato compartidas (fechas en hora de Lima, montos y logo)."""

import base64
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

# Los pedidos y reclamos se guardan en UTC (naive); al usuario se le muestra hora de Lima.
OFFSET_LIMA = timedelta(hours=-5)

LOGO_PATH = Path(__file__).resolve().parent.parent / "static" / "logo-reporte.png"


def a_lima(fecha):
    """UTC -> hora de Lima. Acepta datetime o string ISO; devuelve None si no hay fecha."""
    if not fecha:
        return None
    if isinstance(fecha, str):
        fecha = datetime.fromisoformat(fecha)
    return fecha + OFFSET_LIMA


def dec(valor):
    return Decimal(str(valor))


def a_2_decimales(valor):
    """Decimal redondeado a 2 decimales (mitad hacia arriba, como en caja)."""
    return dec(valor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def num(valor):
    """1234.5 -> '1,234.50' (sin 'S/', los encabezados ya dicen (S/))."""
    return f"{a_2_decimales(valor):,.2f}"


def logo_html(tam):
    """<img> del logo en base64 para los PDF. Sin logo devuelve '' (el PDF se genera igual)."""
    try:
        b64 = base64.b64encode(LOGO_PATH.read_bytes()).decode()
        return f'<img src="data:image/png;base64,{b64}" width="{tam}" height="{tam}" />'
    except OSError:
        return ""
