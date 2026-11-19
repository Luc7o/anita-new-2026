"""
Pruebas de las correcciones de la revisión de código: pagos inciertos con Culqi, revisión de
pagos desde el panel, pedidos sin pagar que no avanzan, bloqueos de fila y vinculación con Google.
"""
import threading
import time
from unittest import mock

import pytest
from sqlalchemy import create_engine, text

from app.extensions import db
from app.models import Pedido, Usuario
from app.utils.culqi import INCIERTO
from tests.conftest import CHECKOUT_RECOJO, stock_de

pytestmark = pytest.mark.db


def _pedido(fabrica, cliente, usuario, stock=5, cantidad=1, metodo="tarjeta", entrega="recojo"):
    p = fabrica.producto(precio=50, stock=stock)
    fabrica.al_carrito(usuario, p, cantidad=cantidad)
    datos = {**CHECKOUT_RECOJO, "metodo_pago": metodo, "tipo_entrega": entrega}
    if entrega == "delivery":
        datos.update(envio_direccion="Jr. Real 123", envio_distrito="Huancayo",
                     envio_provincia="Huancayo", envio_referencia="Frente al parque")
    r = cliente.post("/api/pedidos/checkout", json=datos, headers=fabrica.cabeceras(usuario))
    assert r.status_code == 201, r.get_json()
    return r.get_json()["id"], p


def _pagar(cliente, fabrica, usuario, pedido_id, resultado, clave=None):
    cuerpo = {"token_id": "tkn_1", **({"idempotency_key": clave} if clave else {})}
    with mock.patch("app.routes.pedidos.crear_cargo", return_value=resultado) as cargo:
        r = cliente.post(f"/api/pedidos/{pedido_id}/pagar", json=cuerpo, headers=fabrica.cabeceras(usuario))
    return r, cargo


# --------------------------------------------------------- pago incierto (timeout)
def test_si_culqi_no_responde_el_pedido_queda_en_revision_y_no_se_cobra_otra_vez(fabrica, cliente):
    u = fabrica.usuario()
    pedido_id, p = _pedido(fabrica, cliente, u)
    r, _ = _pagar(cliente, fabrica, u, pedido_id, (INCIERTO, None, None))
    assert r.status_code == 202 and r.get_json()["estado_pago"] == "en_revision"
    # El cliente vuelve a darle a "Pagar": no se llama a Culqi de nuevo.
    r2, cargo = _pagar(cliente, fabrica, u, pedido_id, (True, "chr_2", None))
    assert r2.status_code == 400 and cargo.call_count == 0
    # Tampoco puede cancelarlo mientras no se sepa si pagó.
    assert cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=fabrica.cabeceras(u)).status_code == 409
    assert stock_de(p) == 4


def test_un_pago_en_revision_no_lo_cancela_el_barrido_de_vencidos(fabrica, cliente):
    from datetime import datetime, timedelta

    u = fabrica.usuario()
    pedido_id, p = _pedido(fabrica, cliente, u)
    _pagar(cliente, fabrica, u, pedido_id, (INCIERTO, None, None))
    pedido = db.session.get(Pedido, pedido_id)
    pedido.fecha_limite_pago = datetime.utcnow() - timedelta(hours=1)
    db.session.commit()
    cliente.post("/api/jobs/cancelar-pedidos-vencidos", headers={"Authorization": "Bearer cron-de-prueba"})
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado == "pendiente"
    assert stock_de(p) == 4


# ------------------------------------------------------- revisión de pagos en panel
def _revisar(cliente, fabrica, staff, pedido_id, estado_pago, **extra):
    return cliente.put(f"/api/admin/pedidos/{pedido_id}/pago", json={"estado_pago": estado_pago, **extra},
                       headers=fabrica.cabeceras(staff))


def test_no_se_puede_rechazar_un_pago_que_culqi_ya_cobro(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, p = _pedido(fabrica, cliente, u, entrega="delivery")
    _pagar(cliente, fabrica, u, pedido_id, (True, "chr_ok", None))
    r = _revisar(cliente, fabrica, ventas, pedido_id, "rechazado")
    assert r.status_code == 409
    db.session.expire_all()
    pedido = db.session.get(Pedido, pedido_id)
    assert (pedido.estado, pedido.estado_pago) == ("confirmado", "verificado")
    assert stock_de(p) == 4


def test_no_se_puede_verificar_a_mano_un_pago_que_nadie_hizo(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, _ = _pedido(fabrica, cliente, u, entrega="delivery")
    assert _revisar(cliente, fabrica, ventas, pedido_id, "verificado").status_code == 409
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado_pago == "pendiente"


def test_un_pago_en_revision_se_confirma_o_se_rechaza_desde_el_panel(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    confirmado_id, _ = _pedido(fabrica, cliente, u, entrega="delivery")
    rechazado_id, p2 = _pedido(fabrica, cliente, u, entrega="delivery")
    for pid in (confirmado_id, rechazado_id):
        _pagar(cliente, fabrica, u, pid, (INCIERTO, None, None))

    ok = _revisar(cliente, fabrica, ventas, confirmado_id, "verificado", culqi_cargo_id="chr_visto")
    assert ok.status_code == 200, ok.get_json()
    no = _revisar(cliente, fabrica, ventas, rechazado_id, "rechazado")
    assert no.status_code == 200, no.get_json()
    db.session.expire_all()
    confirmado = db.session.get(Pedido, confirmado_id)
    assert (confirmado.estado, confirmado.estado_pago, confirmado.culqi_cargo_id) == ("confirmado", "verificado", "chr_visto")
    assert db.session.get(Pedido, rechazado_id).estado == "cancelado"
    assert stock_de(p2) == 5


def test_cancelar_un_pedido_pagado_lo_deja_para_reembolsar(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, p = _pedido(fabrica, cliente, u, entrega="delivery")
    _pagar(cliente, fabrica, u, pedido_id, (True, "chr_ok", None))
    r = cliente.put(f"/api/admin/pedidos/{pedido_id}/estado", json={"estado": "cancelado"},
                    headers=fabrica.cabeceras(ventas))
    assert r.status_code == 200, r.get_json()
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado_pago == "reembolso_pendiente"
    assert stock_de(p) == 5


def test_reembolsar_llama_a_culqi_con_el_cargo_y_solo_una_vez(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, _ = _pedido(fabrica, cliente, u, entrega="delivery")
    _pagar(cliente, fabrica, u, pedido_id, (True, "chr_ok", None))
    cliente.put(f"/api/admin/pedidos/{pedido_id}/estado", json={"estado": "cancelado"}, headers=fabrica.cabeceras(ventas))
    with mock.patch("app.routes.admin_pedidos.reembolsar_en_culqi", return_value=(True, "ref_1", None)) as reembolso:
        assert _revisar(cliente, fabrica, ventas, pedido_id, "reembolsado").status_code == 200
        assert _revisar(cliente, fabrica, ventas, pedido_id, "reembolsado").status_code == 400
    assert reembolso.call_count == 1


# --------------------------------------------------- pedidos sin pagar no avanzan
def test_un_pedido_de_tarjeta_sin_pagar_no_se_puede_confirmar_ni_despachar(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, _ = _pedido(fabrica, cliente, u, entrega="delivery")
    r = cliente.put(f"/api/admin/pedidos/{pedido_id}/estado", json={"estado": "confirmado"},
                    headers=fabrica.cabeceras(ventas))
    assert r.status_code == 409
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado == "pendiente"


def test_cancelar_desde_el_panel_un_pedido_sin_pagar_no_lo_deja_pendiente_de_pago(fabrica, cliente):
    u, ventas = fabrica.usuario(), fabrica.usuario("ventas")
    pedido_id, p = _pedido(fabrica, cliente, u, entrega="delivery")
    r = cliente.put(f"/api/admin/pedidos/{pedido_id}/estado", json={"estado": "cancelado"},
                    headers=fabrica.cabeceras(ventas))
    assert r.status_code == 200, r.get_json()
    db.session.expire_all()
    pedido = db.session.get(Pedido, pedido_id)
    assert (pedido.estado, pedido.estado_pago) == ("cancelado", "rechazado")
    assert stock_de(p) == 5


# ------------------------------------------------------------- bloqueo de la fila
def test_cancelar_espera_a_que_termine_un_cobro_en_curso(app, fabrica, cliente):
    """
    Otra conexión bloquea la fila del pedido (como hace /pagar mientras habla con Culqi) y, antes
    de soltarla, lo marca pagado. La cancelación del cliente debe ESPERAR y luego ver que ya está
    pagado (403), en vez de cancelar un pedido recién cobrado y devolver su stock.
    """
    u = fabrica.usuario()
    pedido_id, p = _pedido(fabrica, cliente, u)
    cab = fabrica.cabeceras(u)
    motor = create_engine(app.config["SQLALCHEMY_DATABASE_URI"])
    bloqueada = threading.Event()

    def cobro_lento():
        with motor.begin() as con:
            con.execute(text("SELECT id FROM pedidos WHERE id = :id FOR UPDATE"), {"id": pedido_id})
            bloqueada.set()
            time.sleep(1.5)
            con.execute(text("UPDATE pedidos SET estado_pago = 'verificado', estado = 'confirmado' WHERE id = :id"),
                        {"id": pedido_id})

    hilo = threading.Thread(target=cobro_lento)
    hilo.start()
    assert bloqueada.wait(5)
    inicio = time.monotonic()
    r = cliente.post(f"/api/pedidos/{pedido_id}/cancelar", headers=cab)
    espero = time.monotonic() - inicio
    hilo.join()
    motor.dispose()

    assert espero >= 1.0, "la cancelación no esperó al lock del cobro"
    assert r.status_code == 403
    db.session.expire_all()
    assert db.session.get(Pedido, pedido_id).estado == "confirmado"
    assert stock_de(p) == 4


# ------------------------------------------------- vinculación con Google (cuenta)
def test_entrar_con_google_saca_a_quien_registro_el_correo_antes(app, fabrica, cliente):
    # Alguien registró la cuenta con el correo de la víctima y le puso contraseña.
    intruso = fabrica.usuario(email="victima@gmail.com")
    cab_intruso = fabrica.cabeceras(intruso)

    app.config["GOOGLE_CLIENT_ID"] = "cliente-google-prueba"
    perfil = {"sub": "google-123", "email": "victima@gmail.com", "nombre": "Vic", "apellido": "Tima"}
    try:
        with mock.patch("app.routes.auth.verificar_token_google", return_value=perfil):
            r = cliente.post("/api/auth/google", json={"credential": "token-de-google"})
    finally:
        app.config["GOOGLE_CLIENT_ID"] = ""
    assert r.status_code == 200, r.get_json()

    # La sesión del intruso muere y su contraseña ya no sirve.
    assert cliente.get("/api/auth/perfil", headers=cab_intruso).status_code == 401
    entra = cliente.post("/api/auth/login", json={"email": "victima@gmail.com", "password": fabrica.PASSWORD})
    assert entra.status_code == 401
    db.session.expire_all()
    cuenta = db.session.get(Usuario, intruso.id)
    assert cuenta.google_id == "google-123" and cuenta.password_hash is None and not cuenta.totp_activo
