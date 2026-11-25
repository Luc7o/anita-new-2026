"""
Entorno común de las pruebas E2E: variables INOFENSIVAS para el backend.
Nunca se lee backend/.env (claves reales) y solo se acepta una base local.
"""
import os
import sys
from urllib.parse import urlparse

BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
sys.path.insert(0, BACKEND)

URL_BASE = os.getenv("E2E_DATABASE_URL", "postgresql://postgres:test@localhost:54329/anita_e2e")
if (urlparse(URL_BASE).hostname or "") not in {"localhost", "127.0.0.1", "::1"}:
    raise SystemExit("E2E_DATABASE_URL debe ser una base LOCAL y desechable: las pruebas borran sus datos.")

PUERTO_API = int(os.getenv("E2E_PUERTO_API", "5055"))
PUERTO_CULQI = int(os.getenv("E2E_PUERTO_CULQI", "5056"))
PUERTO_TIENDA = int(os.getenv("E2E_PUERTO_TIENDA", "3000"))

import dotenv  # noqa: E402

dotenv.load_dotenv = lambda *a, **k: False

os.environ.update({
    "DATABASE_URL": URL_BASE,
    "SECRET_KEY": "e2e-clave-solo-para-pruebas-0123456789",
    "JWT_SECRET_KEY": "e2e-jwt-solo-para-pruebas-0123456789ab",
    "FLASK_ENV": "testing",
    "VERCEL_ENV": "",
    "REDIS_URL": "",
    "RESEND_API_KEY": "",
    "CULQI_SECRET_KEY": "sk_test_e2e",
    "CULQI_BASE_URL": f"http://127.0.0.1:{PUERTO_CULQI}",
    "API_PERU_TOKEN": "",
    "GOOGLE_CLIENT_ID": "",
    "CRON_SECRET": "cron-e2e",
    "BLOB_READ_WRITE_TOKEN": "",
    "CORREOS_AVISO_PEDIDOS": "",
    "CORREO_ADJUNTAR_BOLETA": "false",
    "KPI_LATENCIA_SAMPLE_RATE": "0",
    "SEGUNDOS_ENTRE_BARRIDOS_VENCIDOS": "0",
    "FRONTEND_ORIGIN": f"http://127.0.0.1:{PUERTO_TIENDA}",
    "FRONTEND_TIENDA_URL": f"http://127.0.0.1:{PUERTO_TIENDA}",
})
