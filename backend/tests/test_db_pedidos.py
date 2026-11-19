"""
Checkout, pago con Culqi (simulado), cancelación, plazo de pago y acceso a pedidos ajenos.

Varias pruebas cubren errores REALES encontrados en la revisión de código (ya corregidos): si alguno
vuelve a aparecer, la prueba correspondiente falla.
"""
from datetime import datetime, timedelta
from unittest import mock

import pytest

from app.extensions import db
from app.models import IntentoPago, MovimientoStock, Pedido
from tests.conftest import CHECKOUT_RECOJO, stock_de

pytestmark = pytest.mark.db


def _checkout(cliente, cab, **cambios):
    datos = {**CHECKOUT_RECOJO, **cambios}
    return cliente.post("/api/pedidos/checkout", json=datos, headers=cab)


def _cargo_aprobado(cargo_id="chr_prueba"):
    return mock.patch("app.routes.pedidos.crear_cargo", return_value=(True, cargo_id, None))


def _cargo_rechazado(mensaje="Tarjeta sin fondos"):
    return mock.patch("app.routes.pedidos.crear_cargo", return_value=(False, None, mensaje))


# ------------------------------------------------------------------------ checkout
def test_checkout_crea_el_pedido_descuenta_stock_y_vacia_el_carrito(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(precio=40, stock=5)
    fabrica.al_carrito(u, p, cantidad=2)
    r = _checkout(cliente, fabrica.cabeceras(u))
    assert r.status_code == 201, r.get_json()
    pedido = r.get_json()
    assert float(pedido["total"]) == 80.0
    assert pedido["estado"] == "pendiente"
    assert stock_de(p) == 3
    assert cliente.get("/api/carrito", headers=fabrica.cabeceras(u)).get_json()["items"] == []
    # El descuento queda en el kardex.
    mov = MovimientoStock.query.filter_by(producto_id=p.id, tipo="venta").one()
    assert (mov.cantidad, mov.stock_antes, mov.stock_despues) == (2, 5, 3)


def test_el_total_lo_calcula_el_servidor_con_el_precio_de_oferta(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(precio=100, precio_oferta=70, stock=5)
    fabrica.al_carrito(u, p, cantidad=1)
    # Aunque el navegador mande un total inventado, se ignora.
    r = _checkout(cliente, fabrica.cabeceras(u), total=1, subtotal=1)
    assert float(r.get_json()["total"]) == 70.0


def test_delivery_suma_envio_y_solo_se_permite_en_huancayo(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(precio=30, stock=5)
    fabrica.al_carrito(u, p)
    cab = fabrica.cabeceras(u)
    delivery = dict(
        tipo_entrega="delivery", envio_direccion="Jr. Real 123", envio_provincia="Lima",
        envio_referencia="Frente al parque",
    )
    fuera = _checkout(cliente, cab, envio_distrito="Miraflores", **delivery)
    assert fuera.status_code == 400 and "Huancayo" in fuera.get_json()["error"]
    dentro = _checkout(cliente, cab, envio_distrito="El Tambo", **delivery)
    assert dentro.status_code == 201, dentro.get_json()
    cuerpo = dentro.get_json()
    assert float(cuerpo["costo_envio"]) == 10.0 and float(cuerpo["total"]) == 40.0
    # La provincia la fija el servidor, no lo que mandó el navegador.
    assert db.session.get(Pedido, cuerpo["id"]).envio_provincia == "HUANCAYO"


@pytest.mark.parametrize("cambio, mensaje", [
    ({"metodo_pago": "efectivo"}, "Método de pago"),
    ({"tipo_entrega": "dron"}, "Tipo de entrega"),
    ({"envio_telefono": "12345"}, "teléfono"),
    ({"envio_email": "no-es-correo"}, "correo"),
    ({"envio_numero_documento": "123"}, "DNI"),
    ({"envio_tipo_documento": "pasaporte"}, "DNI o RUC"),
])
def test_checkout_valida_los_datos_de_contacto(fabrica, cliente, cambio, mensaje):
    u = fabrica.usuario()
    fabrica.al_carrito(u, fabrica.producto(stock=5))
    r = _checkout(cliente, fabrica.cabeceras(u), **cambio)
    assert r.status_code == 400 and mensaje in r.get_json()["error"]


def test_carrito_vacio(fabrica, cliente):
    r = _checkout(cliente, fabrica.cabeceras(fabrica.usuario()))
    assert r.status_code == 400 and "vacío" in r.get_json()["error"]


def test_sin_stock_suficiente_responde_409_con_el_detalle(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(stock=1)
    fabrica.al_carrito(u, p, cantidad=3)
    r = _checkout(cliente, fabrica.cabeceras(u))
    assert r.status_code == 409
    assert r.get_json()["items_sin_stock"][0]["disponible"] == 1
    assert stock_de(p) == 1 and Pedido.query.count() == 0


def test_stock_por_talla_es_independiente(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(stock=2, tallas=["S", "M"])
    fabrica.al_carrito(u, p, cantidad=2, talla="M")
    assert _checkout(cliente, fabrica.cabeceras(u)).status_code == 201
    stock = {v.talla: v.stock for v in db.session.get(type(p), p.id).variantes}
    assert stock == {"S": 2, "M": 0}


def test_misma_clave_de_idempotencia_no_duplica_el_pedido(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(stock=5)
    fabrica.al_carrito(u, p)
    cab = fabrica.cabeceras(u)
    primero = _checkout(cliente, cab, idempotency_key="clave-1")
    segundo = _checkout(cliente, cab, idempotency_key="clave-1")
    assert primero.status_code == 201 and segundo.status_code == 200
    assert primero.get_json()["id"] == segundo.get_json()["id"]
    assert Pedido.query.count() == 1 and stock_de(p) == 4


def test_pedido_de_pasarela_tiene_plazo_de_pago(app, fabrica, cliente):
    u = fabrica.usuario()
    fabrica.al_carrito(u, fabrica.producto(stock=5))
    pedido = db.session.get(Pedido, _checkout(cliente, fabrica.cabeceras(u)).get_json()["id"])
    assert pedido.estado_pago == "pendiente"
    minutos = (pedido.fecha_limite_pago - datetime.utcnow()).total_seconds() / 60
    assert app.config["MINUTOS_LIMITE_PAGO"] - 1 < minutos <= app.config["MINUTOS_LIMITE_PAGO"]


def test_no_se_puede_comprar_un_producto_desactivado(fabrica, cliente):
    u = fabrica.usuario()
    p = fabrica.producto(stock=5)
    fabrica.al_carrito(u, p)
    p.activo = False
    db.session.commit()
    assert _checkout(cliente, fabrica.cabeceras(u)).status_code in (400, 409)


# ---------------------------------------------------------------------------- pago
def _pedido_pendiente(fabrica, cliente, usuario, stock=5, cantidad=1):
    p = fabrica.producto(precio=50, stock=stock)
    fabrica.al_carrito(usuario, p, cantidad=cantidad)
    r = _checkout(cliente, fabrica.cabeceras(usuario))
    assert r.status_code == 201, r.get_json()
    return r.get_json()["id"], p


def test_pago_aprobado_confirma_el_pedido_y_registra_el_intento(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, _ = _pedido_pendiente(fabrica, cliente, u)
    with _cargo_aprobado("chr_ok"):
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "tkn_1"}, headers=fabrica.cabeceras(u))
    assert r.status_code == 200, r.get_json()
    pedido = db.session.get(Pedido, pedido_id)
    assert (pedido.estado, pedido.estado_pago, pedido.culqi_cargo_id) == ("confirmado", "verificado", "chr_ok")
    assert IntentoPago.query.filter_by(pedido_id=pedido_id, estado="aprobado").count() == 1


def test_pago_rechazado_deja_el_pedido_pendiente_para_reintentar(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, u)
    with _cargo_rechazado("Tarjeta sin fondos"):
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "tkn_1"}, headers=fabrica.cabeceras(u))
    assert r.status_code == 402 and r.get_json()["error"] == "Tarjeta sin fondos"
    pedido = db.session.get(Pedido, pedido_id)
    assert pedido.estado_pago == "pendiente" and pedido.estado == "pendiente"
    assert IntentoPago.query.filter_by(pedido_id=pedido_id, estado="rechazado").count() == 1
    assert stock_de(p) == 4  # el stock sigue reservado mientras dure el plazo


def test_reintento_con_la_misma_clave_no_cobra_dos_veces(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, _ = _pedido_pendiente(fabrica, cliente, u)
    cab = fabrica.cabeceras(u)
    cuerpo = {"token_id": "tkn_1", "idempotency_key": "pago-1"}
    with _cargo_aprobado() as cargo:
        assert cliente.post(f"/api/pedidos/{pedido_id}/pagar", json=cuerpo, headers=cab).status_code == 200
        assert cliente.post(f"/api/pedidos/{pedido_id}/pagar", json=cuerpo, headers=cab).status_code == 200
    assert cargo.call_count == 1


def test_un_pedido_ya_pagado_no_se_vuelve_a_cobrar(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, _ = _pedido_pendiente(fabrica, cliente, u)
    cab = fabrica.cabeceras(u)
    with _cargo_aprobado() as cargo:
        cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "tkn_1"}, headers=cab)
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "tkn_2"}, headers=cab)
    assert r.status_code == 400 and cargo.call_count == 1


def test_pago_sin_token_no_llama_a_culqi(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, _ = _pedido_pendiente(fabrica, cliente, u)
    with _cargo_aprobado() as cargo:
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={}, headers=fabrica.cabeceras(u))
    assert r.status_code == 400 and cargo.call_count == 0


def test_pago_fuera_de_plazo_cancela_y_libera_el_stock(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, u, stock=3, cantidad=2)
    pedido = db.session.get(Pedido, pedido_id)
    pedido.fecha_limite_pago = datetime.utcnow() - timedelta(minutes=1)
    db.session.commit()
    with _cargo_aprobado() as cargo:
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "tkn_1"}, headers=fabrica.cabeceras(u))
    assert r.status_code == 410 and cargo.call_count == 0
    assert db.session.get(Pedido, pedido_id).estado == "cancelado"
    assert stock_de(p) == 3


# --------------------------------------------------------------------- cancelación
def test_cliente_cancela_un_pedido_sin_pagar_y_vuelve_el_stock(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, u, stock=4, cantidad=3)
    r = cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=fabrica.cabeceras(u))
    assert r.status_code == 200 and r.get_json()["estado"] == "cancelado"
    assert stock_de(p) == 4
    # Cancelar de nuevo no vuelve a sumar stock.
    assert cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=fabrica.cabeceras(u)).status_code == 400
    assert stock_de(p) == 4


def test_cliente_no_puede_cancelar_un_pedido_ya_pagado(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, u)
    with _cargo_aprobado():
        cliente.post(f"/api/pedidos/{pedido_id}/pagar", json={"token_id": "t"}, headers=fabrica.cabeceras(u))
    r = cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=fabrica.cabeceras(u))
    assert r.status_code == 403
    assert stock_de(p) == 4


def test_pedido_cancelado_no_queda_con_pago_pendiente(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, _ = _pedido_pendiente(fabrica, cliente, u)
    cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=fabrica.cabeceras(u))
    assert db.session.get(Pedido, pedido_id).estado_pago != "pendiente"


# ------------------------------------------------------------ pedidos ajenos (IDOR)
@pytest.mark.parametrize("metodo, ruta", [
    ("GET", ""), ("GET", "/boleta"), ("POST", "/cancelar"), ("POST", "/pagar"),
])
def test_nadie_ve_ni_toca_pedidos_ajenos(fabrica, cliente, metodo, ruta):
    duena = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, duena)
    intrusa = fabrica.usuario()
    with _cargo_aprobado() as cargo:
        r = cliente.open(f"/api/pedidos/{pedido_id}{ruta}", method=metodo, json={"token_id": "t"},
                         headers=fabrica.cabeceras(intrusa))
    assert r.status_code == 404
    assert cargo.call_count == 0
    assert db.session.get(Pedido, pedido_id).estado == "pendiente"


def test_la_lista_de_pedidos_solo_trae_los_propios(fabrica, cliente):
    a, b = fabrica.usuario(), fabrica.usuario()
    _pedido_pendiente(fabrica, cliente, a)
    _pedido_pendiente(fabrica, cliente, b)
    pedidos = cliente.get("/api/pedidos", headers=fabrica.cabeceras(a)).get_json()
    assert len(pedidos) == 1


# --------------------------------------------------------------- cron de vencidos
def test_el_cron_exige_su_secreto(fabrica, cliente):
    assert cliente.post("/api/jobs/cancelar-pedidos-vencidos").status_code == 403
    assert cliente.post("/api/jobs/cancelar-pedidos-vencidos",
                        headers={"Authorization": "Bearer otro"}).status_code == 403


def test_el_cron_cancela_solo_los_vencidos(fabrica, cliente):
    u = fabrica.usuario()
    vencido_id, p1 = _pedido_pendiente(fabrica, cliente, u)
    vigente_id, p2 = _pedido_pendiente(fabrica, cliente, u)
    vencido = db.session.get(Pedido, vencido_id)
    vencido.fecha_limite_pago = datetime.utcnow() - timedelta(minutes=5)
    db.session.commit()
    r = cliente.post("/api/jobs/cancelar-pedidos-vencidos", headers={"Authorization": "Bearer cron-de-prueba"})
    assert r.status_code == 200, r.get_json()
    db.session.expire_all()
    assert db.session.get(Pedido, vencido_id).estado == "cancelado"
    assert db.session.get(Pedido, vigente_id).estado == "pendiente"
    assert (stock_de(p1), stock_de(p2)) == (5, 4)


def test_el_cron_no_toca_pedidos_que_ya_salieron(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido_pendiente(fabrica, cliente, u)
    pedido = db.session.get(Pedido, pedido_id)
    pedido.estado = "enviado"  # el panel deja despachar sin pago verificado (mismo error 8)
    pedido.fecha_limite_pago = datetime.utcnow() - timedelta(minutes=5)
    db.session.commit()
    cliente.post("/api/jobs/cancelar-pedidos-vencidos", headers={"Authorization": "Bearer cron-de-prueba"})
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado == "enviado"
    assert stock_de(p) == 4


# ------------------------------------------------- respuestas de error que guardan
def test_una_respuesta_de_error_no_guarda_cambios_a_medias(app, fabrica, cliente):
    u = fabrica.usuario()
    cab = fabrica.cabeceras(u)
    app.config["KPI_LATENCIA_SAMPLE_RATE"] = 1.0
    try:
        r = cliente.put("/api/auth/perfil", headers=cab, json={"nombre": "Cambiado", "distrito_id": 999999})
    finally:
        app.config["KPI_LATENCIA_SAMPLE_RATE"] = 0.0
    assert r.status_code == 400
    db.session.expire_all()
    assert db.session.get(type(u), u.id).nombre == "Prueba"
