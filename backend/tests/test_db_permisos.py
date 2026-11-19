"""
Permisos del panel: TODA ruta /api/admin/* debe rechazar a un cliente y a quien no tiene sesión.

La lista de rutas se arma sola a partir de la app, así que una ruta admin nueva queda
cubierta automáticamente: si alguien olvida poner @requiere_roles, esta prueba falla.
"""
import pytest

from app.extensions import db

pytestmark = pytest.mark.db


def _rutas_admin(app):
    rutas = []
    for regla in app.url_map.iter_rules():
        if not regla.rule.startswith("/api/admin"):
            continue
        url = regla.rule
        for argumento in regla.arguments:
            url = url.replace(f"<int:{argumento}>", "1").replace(f"<{argumento}>", "x")
            url = url.replace(f"<string:{argumento}>", "x").replace(f"<path:{argumento}>", "x")
        for metodo in sorted(regla.methods - {"HEAD", "OPTIONS"}):
            rutas.append((metodo, url))
    return rutas


def test_hay_rutas_admin_que_revisar(app):
    assert len(_rutas_admin(app)) > 40


def test_sin_sesion_ninguna_ruta_admin_responde_datos(app, fabrica, cliente):
    for metodo, url in _rutas_admin(app):
        r = cliente.open(url, method=metodo, json={})
        assert r.status_code in (401, 403), f"{metodo} {url} respondió {r.status_code} sin sesión"


def test_un_cliente_no_entra_a_ninguna_ruta_admin(app, fabrica, cliente):
    cab = fabrica.cabeceras(fabrica.usuario("cliente"))
    for metodo, url in _rutas_admin(app):
        r = cliente.open(url, method=metodo, json={}, headers=cab)
        assert r.status_code == 403, f"{metodo} {url} dejó pasar a un cliente ({r.status_code})"


@pytest.mark.parametrize("rol, metodo, url, permitido", [
    # Usuarios y roles: solo superadmin.
    ("superadmin", "GET", "/api/admin/usuarios", True),
    ("administrativo", "GET", "/api/admin/usuarios", False),
    # Productos: los ve también almacén.
    ("almacen", "GET", "/api/admin/productos", True),
    ("cajero", "GET", "/api/admin/productos", True),
    # Proveedores: ventas y cajero no.
    ("ventas", "GET", "/api/admin/proveedores", False),
    ("cajero", "GET", "/api/admin/proveedores", False),
    ("almacen", "GET", "/api/admin/proveedores", True),
    # Pedidos: el cajero no ve la lista.
    ("cajero", "GET", "/api/admin/pedidos", False),
    ("ventas", "GET", "/api/admin/pedidos", True),
    ("administrativo", "GET", "/api/admin/pedidos", True),
])
def test_cada_rol_ve_solo_lo_suyo(fabrica, cliente, rol, metodo, url, permitido):
    cab = fabrica.cabeceras(fabrica.usuario(rol))
    r = cliente.open(url, method=metodo, headers=cab)
    if permitido:
        assert r.status_code == 200, (rol, url, r.status_code, r.get_json())
    else:
        assert r.status_code == 403, (rol, url, r.status_code)


def test_cambiar_de_rol_tiene_efecto_inmediato(fabrica, cliente):
    u = fabrica.usuario("administrativo")
    cab = fabrica.cabeceras(u)
    assert cliente.get("/api/admin/productos", headers=cab).status_code == 200
    u.rol = "cliente"
    db.session.commit()
    assert cliente.get("/api/admin/productos", headers=cab).status_code == 403
