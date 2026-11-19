"""Registro, login, bloqueo por intentos, refresh con CSRF y cierre de sesión."""
import pytest

from app.extensions import db
from app.models import Usuario

pytestmark = pytest.mark.db


def _registro(cliente, **extra):
    datos = {
        "nombre": "Ana", "apellido": "Prueba", "email": "ana@prueba.test",
        "password": "secreta123", "acepta_terminos": True,
    }
    datos.update(extra)
    return cliente.post("/api/auth/registro", json=datos)


def test_registro_crea_cliente_y_devuelve_sesion(fabrica, cliente):
    r = _registro(cliente)
    assert r.status_code == 201
    cuerpo = r.get_json()
    assert cuerpo["token"] and cuerpo["csrf"]
    assert cuerpo["usuario"]["rol"] == "cliente"
    assert "password_hash" not in cuerpo["usuario"]
    # La cookie de refresh es httpOnly: el JavaScript del navegador no puede leerla.
    cookie = next(c for c in r.headers.getlist("Set-Cookie") if c.startswith("ans_refresh_token="))
    assert "HttpOnly" in cookie


def test_registro_exige_aceptar_terminos_literalmente(fabrica, cliente):
    assert _registro(cliente, acepta_terminos="true").status_code == 400
    assert _registro(cliente, acepta_terminos=None).status_code == 400


def test_registro_rechaza_password_corta_y_email_repetido(fabrica, cliente):
    assert _registro(cliente, password="123").status_code == 400
    assert _registro(cliente).status_code == 201
    # El email es CITEXT: en mayúsculas también cuenta como repetido.
    assert _registro(cliente, email="ANA@PRUEBA.TEST").status_code == 409


def test_login_correcto_e_incorrecto(fabrica, cliente):
    u = fabrica.usuario(email="luz@prueba.test")
    ok = cliente.post("/api/auth/login", json={"email": "LUZ@prueba.test", "password": fabrica.PASSWORD})
    assert ok.status_code == 200 and ok.get_json()["token"]
    mal = cliente.post("/api/auth/login", json={"email": u.email, "password": "otra"})
    assert mal.status_code == 401
    # Mismo mensaje si el correo no existe: no se revela qué cuentas hay.
    inexistente = cliente.post("/api/auth/login", json={"email": "nadie@prueba.test", "password": "x"})
    assert inexistente.get_json()["error"] == mal.get_json()["error"]


def test_cinco_intentos_fallidos_bloquean_la_cuenta(fabrica, cliente):
    u = fabrica.usuario()
    for _ in range(5):
        cliente.post("/api/auth/login", json={"email": u.email, "password": "mala"})
    # Bloqueada: ni siquiera la contraseña correcta entra.
    r = cliente.post("/api/auth/login", json={"email": u.email, "password": fabrica.PASSWORD})
    assert r.status_code == 429


def test_cuenta_desactivada_no_entra_y_pierde_acceso_al_instante(fabrica, cliente):
    u = fabrica.usuario()
    cab = fabrica.cabeceras(u)
    assert cliente.get("/api/auth/perfil", headers=cab).status_code == 200
    u.activo = False
    db.session.commit()
    assert cliente.get("/api/auth/perfil", headers=cab).status_code == 403
    r = cliente.post("/api/auth/login", json={"email": u.email, "password": fabrica.PASSWORD})
    assert r.status_code == 403


def test_rutas_privadas_exigen_token(fabrica, cliente):
    r = cliente.get("/api/auth/perfil")
    assert r.status_code == 401 and r.get_json()["code"] == "token_faltante"
    r = cliente.get("/api/auth/perfil", headers={"Authorization": "Bearer no-es-un-jwt"})
    assert r.status_code == 401


def test_refresh_exige_la_cabecera_csrf(fabrica, cliente):
    u = fabrica.usuario()
    login = cliente.post("/api/auth/login", json={"email": u.email, "password": fabrica.PASSWORD})
    csrf = login.get_json()["csrf"]
    # El navegador manda la cookie solo; sin la cabecera CSRF no debe servir.
    sin_csrf = cliente.post("/api/auth/refrescar-token")
    assert sin_csrf.status_code == 401
    con_csrf = cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": csrf})
    assert con_csrf.status_code == 200 and con_csrf.get_json()["token"]


def test_logout_revoca_los_tokens_ya_emitidos(fabrica, cliente):
    u = fabrica.usuario()
    login = cliente.post("/api/auth/login", json={"email": u.email, "password": fabrica.PASSWORD}).get_json()
    cab = {"Authorization": f"Bearer {login['token']}"}
    r = cliente.post("/api/auth/logout", headers={**cab, "X-CSRF-Token": login["csrf"]})
    assert r.status_code == 200
    # El access token sigue sin expirar, pero ya no vale.
    assert cliente.get("/api/auth/perfil", headers=cab).status_code == 401
    # Y el refresh tampoco.
    assert cliente.post("/api/auth/refrescar-token", headers={"X-CSRF-Token": login["csrf"]}).status_code == 401


def test_cambiar_password_cierra_las_otras_sesiones(fabrica, cliente):
    u = fabrica.usuario()
    cab_vieja = fabrica.cabeceras(u)
    r = cliente.put("/api/auth/cambiar-password", headers=cab_vieja, json={
        "password_actual": fabrica.PASSWORD, "password_nueva": "nueva-clave-456",
    })
    assert r.status_code == 200, r.get_json()
    assert cliente.get("/api/auth/perfil", headers=cab_vieja).status_code == 401
    entra = cliente.post("/api/auth/login", json={"email": u.email, "password": "nueva-clave-456"})
    assert entra.status_code == 200


def test_la_contrasena_se_guarda_con_hash(fabrica):
    u = fabrica.usuario()
    guardado = db.session.get(Usuario, u.id).password_hash
    assert fabrica.PASSWORD not in guardado
    assert guardado.startswith("pbkdf2:sha256")
