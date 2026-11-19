"""Cobros y reembolsos con Culqi, sin llamar a la API real (se simula `requests.post`)."""
from types import SimpleNamespace
from unittest import mock

import pytest
import requests

from app.utils import culqi


def _pedido(total="59.90", cargo=None):
    return SimpleNamespace(id=7, numero_pedido="ANS-1", total=total, culqi_cargo_id=cargo)


def _usuario():
    return SimpleNamespace(
        email="ana@prueba.test", nombre="Ana", apellido="Prueba",
        direccion=None, distrito=None, provincia=None, telefono="987654321",
    )


def _respuesta(status, cuerpo):
    r = mock.Mock(status_code=status, content=b"x")
    r.json.return_value = cuerpo
    return r


def test_cobra_el_total_en_centimos_y_con_la_llave_privada(ctx):
    with mock.patch.object(culqi.requests, "post", return_value=_respuesta(201, {"object": "charge", "id": "chr_1"})) as post:
        ok, cargo_id, error = culqi.crear_cargo(_pedido("59.90"), _usuario(), "tkn_123")
    assert (ok, cargo_id, error) == (True, "chr_1", None)
    enviado = post.call_args.kwargs
    assert enviado["json"]["amount"] == 5990
    assert enviado["json"]["currency_code"] == "PEN"
    assert enviado["json"]["source_id"] == "tkn_123"
    assert enviado["headers"]["Authorization"] == "Bearer sk_test_falsa"


def test_redondeo_de_centimos_no_pierde_un_sol(ctx):
    # 19.99 * 100 en coma flotante es 1998.9999...: debe cobrarse 1999, no 1998.
    with mock.patch.object(culqi.requests, "post", return_value=_respuesta(201, {"object": "charge", "id": "chr_2"})) as post:
        culqi.crear_cargo(_pedido("19.99"), _usuario(), "tkn_1")
    assert post.call_args.kwargs["json"]["amount"] == 1999


def test_rechazo_del_banco_devuelve_el_mensaje_para_el_cliente(ctx):
    cuerpo = {"object": "error", "user_message": "Tarjeta sin fondos", "code": "card_declined"}
    with mock.patch.object(culqi.requests, "post", return_value=_respuesta(402, cuerpo)):
        ok, cargo_id, error = culqi.crear_cargo(_pedido(), _usuario(), "tkn_1")
    assert ok is False and cargo_id is None and error == "Tarjeta sin fondos"


def test_si_no_se_pudo_conectar_es_un_rechazo_seguro(ctx):
    # El cargo nunca salió: el cliente puede reintentar sin riesgo de pagar dos veces.
    with mock.patch.object(culqi.requests, "post", side_effect=requests.ConnectTimeout("caído")):
        ok, _, error = culqi.crear_cargo(_pedido(), _usuario(), "tkn_1")
    assert ok is False and "contactar" in error


@pytest.mark.parametrize("falla", [
    requests.ReadTimeout("sin respuesta"),
    requests.ConnectionError("conexión cortada a mitad de respuesta"),
])
def test_si_culqi_pudo_cobrar_el_resultado_es_incierto(ctx, falla):
    # El cargo ya pudo llegar a Culqi: NO es un rechazo (reintentar cobraría dos veces).
    with mock.patch.object(culqi.requests, "post", side_effect=falla):
        ok, cargo_id, _ = culqi.crear_cargo(_pedido(), _usuario(), "tkn_1")
    assert ok is culqi.INCIERTO and cargo_id is None


@pytest.mark.parametrize("respuesta", [
    _respuesta(200, {"object": "otra_cosa"}),
    _respuesta(502, {}),
])
def test_respuesta_inesperada_no_se_toma_como_aprobada_ni_rechazada(ctx, respuesta):
    with mock.patch.object(culqi.requests, "post", return_value=respuesta):
        ok, cargo_id, _ = culqi.crear_cargo(_pedido(), _usuario(), "tkn_1")
    assert ok is culqi.INCIERTO and cargo_id is None


def test_una_respuesta_que_no_es_json_no_revienta(ctx):
    html = mock.Mock(status_code=503, content=b"<html>caido</html>")
    html.json.side_effect = ValueError("no es JSON")
    with mock.patch.object(culqi.requests, "post", return_value=html):
        ok, _, _ = culqi.crear_cargo(_pedido(), _usuario(), "tkn_1")
    assert ok is culqi.INCIERTO


def test_reembolso_sin_cargo_registrado_no_llama_a_culqi(ctx):
    with mock.patch.object(culqi.requests, "post") as post:
        ok, _, error = culqi.reembolsar_en_culqi(_pedido(cargo=None))
    assert ok is False and "manualmente" in error
    post.assert_not_called()


def test_reembolso_usa_el_cargo_original_y_el_total(ctx):
    with mock.patch.object(culqi.requests, "post", return_value=_respuesta(201, {"object": "refund", "id": "ref_1"})) as post:
        ok, reembolso_id, _ = culqi.reembolsar_en_culqi(_pedido("100.00", cargo="chr_9"))
    assert ok and reembolso_id == "ref_1"
    assert post.call_args.kwargs["json"] == {"amount": 10000, "charge_id": "chr_9", "reason": "solicitud_comprador"}
