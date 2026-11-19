"""
Configuración común de las pruebas del backend.

Dos tipos de prueba:
- Unitarias (sin base de datos): corren siempre.
- De integración (marcadas con @pytest.mark.db): necesitan una base PostgreSQL VACÍA y
  DESECHABLE en TEST_DATABASE_URL. Se le aplican las migraciones y se borran sus datos
  entre prueba y prueba. Sin TEST_DATABASE_URL se saltan.

    # Base de prueba con Docker (una sola vez):
    docker run -d --name anita-test-db -e POSTGRES_PASSWORD=test -e POSTGRES_DB=anita_test -p 54329:5432 postgres:16-alpine

    # Correr todo (desde backend/):
    set TEST_DATABASE_URL=postgresql://postgres:test@localhost:54329/anita_test   (Windows cmd)
    $env:TEST_DATABASE_URL="postgresql://postgres:test@localhost:54329/anita_test" (PowerShell)
    python -m pytest

SEGURIDAD: las pruebas NUNCA leen backend/.env (ahí están las claves reales de Neon, Culqi,
Resend...) y se niegan a correr contra una base que no sea local, para no borrar datos reales.
"""
import os
import sys
import uuid
from urllib.parse import urlparse

import pytest

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

# --- 1. Nunca cargar el .env real -------------------------------------------------------
# app/config.py llama a load_dotenv() al importarse. Lo anulamos ANTES de importar la app:
# así ninguna clave real (Culqi, Resend, Blob, Neon, API Perú...) llega a las pruebas.
import dotenv  # noqa: E402

dotenv.load_dotenv = lambda *a, **k: False

HOSTS_LOCALES = {"localhost", "127.0.0.1", "::1", "host.docker.internal"}
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "").strip()


def _es_base_local(url):
    return (urlparse(url).hostname or "") in HOSTS_LOCALES


if TEST_DATABASE_URL and not _es_base_local(TEST_DATABASE_URL) and os.getenv("PERMITIR_BASE_REMOTA_EN_TESTS") != "1":
    raise pytest.UsageError(
        "TEST_DATABASE_URL apunta a un servidor que no es local. Las pruebas BORRAN los datos de esa "
        "base, así que solo se permiten bases locales y desechables. Si de verdad es una base de "
        "prueba remota (por ejemplo una rama de Neon solo para tests), define "
        "PERMITIR_BASE_REMOTA_EN_TESTS=1."
    )

# --- 2. Variables de entorno de prueba (todas inofensivas) --------------------------------
# Sin base de prueba se usa una URL que no existe: las pruebas unitarias no la tocan.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL or "postgresql://nadie:nada@127.0.0.1:1/no_existe"
os.environ.update({
    "SECRET_KEY": "clave-solo-para-pruebas-0123456789abcdef",
    "JWT_SECRET_KEY": "jwt-solo-para-pruebas-0123456789abcdefgh",
    "FLASK_ENV": "testing",
    "VERCEL_ENV": "",
    "REDIS_URL": "",
    "RESEND_API_KEY": "",          # los correos se imprimen, no se envían
    "CULQI_SECRET_KEY": "sk_test_falsa",  # las llamadas a Culqi se simulan en cada prueba
    "CULQI_BASE_URL": "https://culqi.invalid",
    "API_PERU_TOKEN": "",
    "GOOGLE_CLIENT_ID": "",
    "CRON_SECRET": "cron-de-prueba",
    "BLOB_READ_WRITE_TOKEN": "",
    "CORREOS_AVISO_PEDIDOS": "",
    "CORREO_ADJUNTAR_BOLETA": "false",
    "KPI_LATENCIA_SAMPLE_RATE": "0",
    "FRONTEND_ORIGIN": "http://localhost:5173",
})

from app import create_app  # noqa: E402
from app.extensions import db, limiter  # noqa: E402

# Tablas con datos de referencia que cargan las migraciones: no se vacían entre pruebas.
TABLAS_DE_REFERENCIA = {
    "roles", "tallas", "colores", "configuracion_tienda",
    "ubigeo_departamentos", "ubigeo_provincias", "ubigeo_distritos",
    "migraciones_aplicadas",
}


def pytest_configure(config):
    config.addinivalue_line("markers", "db: prueba de integración que necesita TEST_DATABASE_URL")


def pytest_collection_modifyitems(config, items):
    if TEST_DATABASE_URL:
        return
    saltar = pytest.mark.skip(reason="Falta TEST_DATABASE_URL (base PostgreSQL local de prueba)")
    for item in items:
        if "db" in item.keywords:
            item.add_marker(saltar)


@pytest.fixture(scope="session")
def app():
    aplicacion = create_app()
    aplicacion.config["TESTING"] = True
    limiter.enabled = False  # los límites por minuto se prueban aparte, no deben frenar el resto
    if TEST_DATABASE_URL:
        with aplicacion.app_context():
            _aplicar_migraciones()
    return aplicacion


def _aplicar_migraciones():
    import aplicar_migraciones

    codigo = aplicar_migraciones.main()
    assert codigo == 0, "No se pudieron aplicar las migraciones a la base de prueba"


@pytest.fixture()
def ctx(app):
    with app.app_context():
        yield app


@pytest.fixture()
def cliente(app):
    return app.test_client()


@pytest.fixture()
def base_limpia(ctx):
    """Vacía las tablas de datos antes de cada prueba de integración."""
    _vaciar_tablas()
    yield
    db.session.rollback()
    db.session.remove()


def _vaciar_tablas():
    from sqlalchemy import text

    filas = db.session.execute(text(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    )).all()
    tablas = [f.tablename for f in filas if f.tablename not in TABLAS_DE_REFERENCIA]
    if tablas:
        lista = ", ".join(f'"{t}"' for t in tablas)
        db.session.execute(text(f"TRUNCATE {lista} RESTART IDENTITY CASCADE"))
    # Las tallas y colores que crean las pruebas sí se borran (se conservan los de id 1).
    db.session.execute(text("DELETE FROM tallas WHERE id <> 1"))
    db.session.execute(text("DELETE FROM colores WHERE id <> 1"))
    db.session.commit()


# --------------------------------------------------------------------------- fábricas
@pytest.fixture()
def fabrica(base_limpia, cliente):
    return Fabrica(cliente)


class Fabrica:
    """Crea datos de prueba con lo mínimo necesario."""

    PASSWORD = "Clave-de-prueba-123"

    def __init__(self, cliente):
        self.cliente = cliente

    def usuario(self, rol="cliente", email=None, activo=True, password=None):
        from app.models import Usuario

        u = Usuario(
            nombre="Prueba",
            apellido=rol.capitalize(),
            email=email or f"{rol}-{uuid.uuid4().hex[:8]}@prueba.test",
            activo=activo,
        )
        u.rol = rol
        u.set_password(password or self.PASSWORD)
        db.session.add(u)
        db.session.commit()
        return u

    def token(self, usuario):
        """Access token real, emitido por el mismo endpoint de login."""
        r = self.cliente.post("/api/auth/login", json={"email": usuario.email, "password": self.PASSWORD})
        assert r.status_code == 200, r.get_json()
        return r.get_json()["token"]

    def cabeceras(self, usuario):
        return {"Authorization": f"Bearer {self.token(usuario)}"}

    def categoria(self, nombre=None):
        from app.models import Categoria

        nombre = nombre or f"Categoria {uuid.uuid4().hex[:6]}"
        c = Categoria(nombre=nombre, slug=nombre.lower().replace(" ", "-"))
        db.session.add(c)
        db.session.commit()
        return c

    def producto(self, precio=50, stock=10, precio_oferta=None, tallas=None, activo=True):
        """Producto simple (una variante sin talla ni color) o con una variante por talla."""
        from app.models import Producto, VarianteProducto

        p = Producto(
            nombre=f"Polo {uuid.uuid4().hex[:6]}",
            precio=precio,
            precio_oferta=precio_oferta,
            categoria_id=self.categoria().id,
            activo=activo,
        )
        db.session.add(p)
        db.session.flush()
        if tallas:
            for talla in tallas:
                v = VarianteProducto(producto_id=p.id, stock=stock)
                v.talla = talla
                db.session.add(v)
        else:
            db.session.add(VarianteProducto(producto_id=p.id, stock=stock))
        db.session.commit()
        return p

    def al_carrito(self, usuario, producto, cantidad=1, talla=None):
        from app.models import ItemCarrito

        variante = producto.variante_para(talla=talla)
        assert variante is not None
        item = ItemCarrito(usuario_id=usuario.id, variante_id=variante.id, cantidad=cantidad)
        db.session.add(item)
        db.session.commit()
        return item


def stock_de(producto):
    """Stock actual leído de la base (no de la sesión)."""
    from sqlalchemy import text

    fila = db.session.execute(
        text("SELECT COALESCE(SUM(stock), 0) AS total FROM variantes_producto WHERE producto_id = :p"),
        {"p": producto.id},
    ).first()
    return int(fila.total)


CHECKOUT_RECOJO = {
    "metodo_pago": "yape",
    "tipo_entrega": "recojo",
    "envio_nombre": "Ana Prueba",
    "envio_telefono": "987654321",
    "envio_email": "ana@prueba.test",
    "envio_tipo_documento": "dni",
    "envio_numero_documento": "12345678",
}
