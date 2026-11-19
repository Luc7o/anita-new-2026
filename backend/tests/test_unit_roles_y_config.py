"""Reglas de permisos (app/roles.py) y arranque seguro de la app."""
import pytest

from app import create_app, roles
from app.config import Config


def test_cliente_nunca_tiene_permisos_del_panel():
    for nombre in dir(roles):
        if nombre.startswith("PUEDE_"):
            assert roles.CLIENTE not in getattr(roles, nombre), nombre


def test_reglas_de_negocio_documentadas_en_el_readme():
    # Ventas gestiona la venta online, pero no registra ventas en tienda.
    assert roles.VENTAS not in roles.PUEDE_REGISTRAR_VENTA
    assert roles.CAJERO in roles.PUEDE_REGISTRAR_VENTA
    # El cajero no cancela ni reembolsa, ni ve reportes.
    assert roles.CAJERO not in roles.PUEDE_GESTIONAR_REEMBOLSOS
    assert roles.CAJERO not in roles.PUEDE_VER_DASHBOARD
    # Almacén edita stock pero no productos ni ve costos.
    assert roles.ALMACEN in roles.PUEDE_GESTIONAR_STOCK
    assert roles.ALMACEN not in roles.PUEDE_GESTIONAR_PRODUCTOS
    assert roles.ALMACEN not in roles.PUEDE_VER_COSTOS
    # Usuarios y configuración: solo superadmin.
    assert roles.PUEDE_GESTIONAR_USUARIOS == [roles.SUPERADMIN]
    assert roles.PUEDE_GESTIONAR_CONFIGURACION == [roles.SUPERADMIN]


def test_todo_rol_usado_en_permisos_existe():
    for nombre in dir(roles):
        if nombre.startswith("PUEDE_"):
            assert set(getattr(roles, nombre)) <= set(roles.ROLES), nombre


@pytest.mark.parametrize("variable", ["SECRET_KEY", "JWT_SECRET_KEY"])
def test_en_produccion_no_arranca_con_secretos_de_desarrollo(monkeypatch, variable):
    monkeypatch.setenv("VERCEL_ENV", "production")

    class ConfigInsegura(Config):
        pass

    setattr(ConfigInsegura, variable, "dev-secret-key" if variable == "SECRET_KEY" else "dev-jwt-secret")
    with pytest.raises(RuntimeError, match=variable):
        create_app(ConfigInsegura)


def test_url_de_neon_con_esquema_viejo_se_normaliza(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@ep-x.neon.tech/db?sslmode=require")
    assert Config._armar_uri() == "postgresql+psycopg2://u:p@ep-x.neon.tech/db?sslmode=require"


def test_sin_database_url_arma_la_conexion_con_las_partes(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DB_USER", "ana")
    monkeypatch.setenv("DB_PASSWORD", "cl@ve:rara")
    monkeypatch.setenv("DB_HOST", "localhost")
    monkeypatch.setenv("DB_PORT", "5432")
    monkeypatch.setenv("DB_NAME", "tienda")
    # La contraseña con @ y : debe ir escapada para no romper la URL.
    assert Config._armar_uri() == "postgresql+psycopg2://ana:cl%40ve%3Arara@localhost:5432/tienda"
