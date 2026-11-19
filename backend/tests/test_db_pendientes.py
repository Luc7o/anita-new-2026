"""
Pruebas de los pendientes de la revisión: stock editado en el panel mientras se vende, bloqueo
de login atómico, refresh tokens de un solo uso y estado intermedio del reembolso.
"""
import threading
from datetime import datetime, timedelta
from unittest import mock

import pytest

from app.extensions import db
from app.models import Pedido, RefreshToken, Usuario
from app.utils.culqi import INCIERTO
from tests.conftest import CHECKOUT_RECOJO, stock_de

pytestmark = pytest.mark.db


# ---------------------------------------------------- stock editado durante una venta
def _vender(fabrica, cliente, producto, cantidad, talla=None):
    comprador = fabrica.usuario()
    fabrica.al_carrito(comprador, producto, cantidad=cantidad, talla=talla)
    r = cliente.post("/api/pedidos/checkout", json=CHECKOUT_RECOJO, headers=fabrica.cabeceras(comprador))
    assert r.status_code == 201, r.get_json()


def test_editar_el_stock_no_borra_las_ventas_hechas_mientras_tanto(fabrica, cliente):
    admin = fabrica.usuario("administrativo")
    p = fabrica.producto(stock=10)
    # El admin abre el formulario (ve 10) y mientras lo tiene abierto se venden 2.
    _vender(fabrica, cliente, p, 2)
    # Quiere sumar 5 unidades que llegaron: escribe 15 sobre el 10 que vio.
    r = cliente.put(f"/api/admin/productos/{p.id}", json={"stock": 15, "stock_original": 10},
                    headers=fabrica.cabeceras(admin))
    assert r.status_code == 200, r.get_json()
    assert stock_de(p) == 13  # 8 que quedaban + 5 que sumó; antes quedaba en 15 (2 fantasma)


def test_lo_mismo_por_talla(fabrica, cliente):
    almacen = fabrica.usuario("almacen")
    p = fabrica.producto(stock=4, tallas=["S", "M"])
    _vender(fabrica, cliente, p, 3, talla="M")
    r = cliente.put(f"/api/admin/productos/{p.id}", headers=fabrica.cabeceras(almacen), json={
        "tallas": ["S", "M"], "colores": [],
        "variantes": [
            {"talla": "S", "color": None, "stock": 6, "stock_original": 4},
            {"talla": "M", "color": None, "stock": 4, "stock_original": 4},
        ],
    })
    assert r.status_code == 200, r.get_json()
    stock = {v.talla: v.stock for v in db.session.get(type(p), p.id).variantes}
    assert stock == {"S": 6, "M": 1}  # en M no cambió nada: siguen las 3 vendidas descontadas


def test_si_ya_no_alcanza_pide_recargar_y_no_guarda_nada(fabrica, cliente):
    admin = fabrica.usuario("administrativo")
    p = fabrica.producto(stock=5)
    _vender(fabrica, cliente, p, 4)  # queda 1
    # El admin quería bajar 3 (de 5 a 2) por una merma: 1 - 3 sería negativo.
    r = cliente.put(f"/api/admin/productos/{p.id}", json={"stock": 2, "stock_original": 5, "nombre": "Nuevo"},
                    headers=fabrica.cabeceras(admin))
    assert r.status_code == 409 and r.get_json()["code"] == "stock_cambio"
    db.session.expire_all()
    assert stock_de(p) == 1 and db.session.get(type(p), p.id).nombre != "Nuevo"


def test_sin_stock_original_funciona_como_antes(fabrica, cliente):
    admin = fabrica.usuario("administrativo")
    p = fabrica.producto(stock=5)
    r = cliente.put(f"/api/admin/productos/{p.id}", json={"stock": 9}, headers=fabrica.cabeceras(admin))
    assert r.status_code == 200 and stock_de(p) == 9


# ------------------------------------------------------------- bloqueo de login
def test_intentos_en_paralelo_si_bloquean_la_cuenta(app, fabrica):
    u = fabrica.usuario()
    email = u.email
    barrera = threading.Barrier(8)

    def intento():
        cliente = app.test_client()
        barrera.wait()
        cliente.post("/api/auth/login", json={"email": email, "password": "mala"})

    hilos = [threading.Thread(target=intento) for _ in range(8)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()
    db.session.expire_all()
    cuenta = db.session.get(Usuario, u.id)
    assert cuenta.intentos_fallidos_login == 8  # ninguno se perdió
    assert cuenta.esta_bloqueado


def test_vencido_el_bloqueo_un_fallo_no_vuelve_a_bloquear(fabrica, cliente):
    u = fabrica.usuario()
    u.intentos_fallidos_login = 5
    u.bloqueado_hasta = datetime.utcnow() - timedelta(minutes=1)
    db.session.commit()
    cliente.post("/api/auth/login", json={"email": u.email, "password": "mala"})
    db.session.expire_all()
    cuenta = db.session.get(Usuario, u.id)
    assert cuenta.intentos_fallidos_login == 1 and not cuenta.esta_bloqueado
    r = cliente.post("/api/auth/login", json={"email": u.email, "password": fabrica.PASSWORD})
    assert r.status_code == 200


# ------------------------------------------------------ refresh de un solo uso
def _login(cliente, fabrica, usuario):
    r = cliente.post("/api/auth/login", json={"email": usuario.email, "password": fabrica.PASSWORD})
    return r.get_json(), cliente.get_cookie("ans_refresh_token", path="/api/auth").value


def test_un_refresh_ya_usado_cierra_todas_las_sesiones(fabrica, cliente, monkeypatch):
    monkeypatch.setattr(RefreshToken, "SEGUNDOS_GRACIA_REUSO", 0)
    u = fabrica.usuario()
    datos, cookie_vieja = _login(cliente, fabrica, u)
    nuevo = cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": datos["csrf"]})
    assert nuevo.status_code == 200
    token_nuevo = nuevo.get_json()["token"]

    # Alguien que copió la cookie vieja intenta usarla.
    cliente.set_cookie("ans_refresh_token", cookie_vieja, path="/api/auth")
    robo = cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": datos["csrf"]})
    assert robo.status_code == 401
    # Por seguridad también se cae la sesión legítima: la dueña vuelve a iniciar sesión.
    assert cliente.get("/api/auth/perfil", headers={"Authorization": f"Bearer {token_nuevo}"}).status_code == 401


def test_dos_pestanas_que_refrescan_a_la_vez_no_cierran_la_sesion(fabrica, cliente):
    u = fabrica.usuario()
    datos, cookie = _login(cliente, fabrica, u)
    primera = cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": datos["csrf"]})
    cliente.set_cookie("ans_refresh_token", cookie, path="/api/auth")  # la otra pestaña, misma cookie
    segunda = cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": datos["csrf"]})
    assert primera.status_code == 200 and segunda.status_code == 200
    token = segunda.get_json()["token"]
    assert cliente.get("/api/auth/perfil", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_cada_refresh_queda_registrado_y_se_gasta(fabrica, cliente):
    u = fabrica.usuario()
    datos, _ = _login(cliente, fabrica, u)
    assert RefreshToken.query.filter_by(usuario_id=u.id, usado_en=None).count() == 1
    cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": datos["csrf"]})
    assert RefreshToken.query.filter_by(usuario_id=u.id).count() == 2
    assert RefreshToken.query.filter(RefreshToken.usuario_id == u.id, RefreshToken.usado_en.isnot(None)).count() == 1


# ------------------------------------------------------ reembolso con estado intermedio
def _pedido_pagado_y_cancelado(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    p = fabrica.producto(precio=50, stock=5)
    fabrica.al_carrito(u, p)
    datos = {**CHECKOUT_RECOJO, "metodo_pago": "tarjeta", "tipo_entrega": "delivery",
             "envio_direccion": "Jr. Real 123", "envio_distrito": "Huancayo",
             "envio_provincia": "Huancayo", "envio_referencia": "Frente al parque"}
    pedido_id = cliente.post("/api/pedidos/checkout", json=datos, headers=fabrica.cabeceras(u)).get_json()["id"]
    with mock.patch("app.routes.pedidos.crear_cargo", return_value=(True, "chr_1", None)):
        cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "t"}, headers=fabrica.cabeceras(u))
    cab = fabrica.cabeceras(ventas)
    cliente.put(f"/api/admin/pedidos/{pedido_id}/estado", json={"estado": "cancelado"}, headers=cab)
    return pedido_id, cab


def _reembolsar(cliente, pedido_id, cab, resultado):
    with mock.patch("app.routes.admin_pedidos.reembolsar_en_culqi", return_value=resultado) as culqi:
        r = cliente.put(f"/api/admin/pedidos/{pedido_id}/pago", json={"estado_pago": "reembolsado"}, headers=cab)
    return r, culqi


def test_si_culqi_no_confirma_el_reembolso_queda_en_proceso_y_no_se_repite(fabrica, cliente):
    pedido_id, cab = _pedido_pagado_y_cancelado(fabrica, cliente)
    r, _ = _reembolsar(cliente, pedido_id, cab, (INCIERTO, None, None))
    assert r.status_code == 202 and r.get_json()["estado_pago"] == "reembolsando"
    # Confirmarlo después NO vuelve a llamar a Culqi (devolvería el dinero dos veces).
    r2, culqi = _reembolsar(cliente, pedido_id, cab, (True, "ref_2", None))
    assert r2.status_code == 200 and culqi.call_count == 0
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado_pago == "reembolsado"


def test_si_culqi_rechaza_el_reembolso_vuelve_a_pendiente(fabrica, cliente):
    pedido_id, cab = _pedido_pagado_y_cancelado(fabrica, cliente)
    r, _ = _reembolsar(cliente, pedido_id, cab, (False, None, "Cargo ya reembolsado"))
    assert r.status_code == 502
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado_pago == "reembolso_pendiente"


def test_reembolso_aprobado(fabrica, cliente):
    pedido_id, cab = _pedido_pagado_y_cancelado(fabrica, cliente)
    r, culqi = _reembolsar(cliente, pedido_id, cab, (True, "ref_1", None))
    assert r.status_code == 200 and culqi.call_count == 1
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado_pago == "reembolsado"
