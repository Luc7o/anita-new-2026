"""
Pruebas del consentimiento de estadísticas de uso (banner de privacidad).

Necesitan una base PostgreSQL con las migraciones aplicadas (001 a 005). Usan la que indique
DATABASE_URL y limpian lo que crean. Ejecutar desde la carpeta backend:

    python -m unittest tests.test_consentimiento -v
"""
import os
import unittest
import uuid
from datetime import datetime, timedelta
from unittest import mock

from app import create_app
from app.extensions import db, limiter
from app.models import ConsentimientoPrivacidad, EventoAnalitica, Usuario
from app.utils.legal import VERSION_CONSENTIMIENTO
from app.utils.mantenimiento import purgar_metricas_antiguas


@unittest.skipUnless(os.getenv("DATABASE_URL"), "Falta DATABASE_URL")
class PruebasConsentimiento(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        limiter.enabled = False
        cls.cliente = cls.app.test_client()

    def setUp(self):
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.sesiones = []
        self.correos = []

    def tearDown(self):
        db.session.rollback()
        for sid in self.sesiones:
            EventoAnalitica.query.filter_by(sesion_id=sid).delete()
            ConsentimientoPrivacidad.query.filter_by(sesion_id=sid).delete()
        for correo in self.correos:
            u = Usuario.query.filter_by(email=correo).first()
            if u:
                EventoAnalitica.query.filter_by(usuario_id=u.id).delete()
                db.session.delete(u)
        ConsentimientoPrivacidad.query.filter(ConsentimientoPrivacidad.version == "v-prueba").delete()
        db.session.commit()
        self.ctx.pop()

    # ------------------------------------------------------------ ayudas
    def nueva_sesion(self):
        sid = f"prueba-{uuid.uuid4()}"
        self.sesiones.append(sid)
        return sid

    def evento(self, sesion_id, token=None, tipo="vista_pagina"):
        cab = {"Authorization": f"Bearer {token}"} if token else {}
        return self.cliente.post("/api/eventos", json={"tipo_evento": tipo, "sesion_id": sesion_id}, headers=cab)

    def aceptar(self, sesion_id):
        return self.cliente.post("/api/consentimiento", json={
            "decision": "aceptado", "version": VERSION_CONSENTIMIENTO, "sesion_id": sesion_id})

    def retirar(self, sesion_id=None, token=None):
        cab = {"Authorization": f"Bearer {token}"} if token else {}
        cuerpo = {"sesion_id": sesion_id} if sesion_id else {}
        return self.cliente.post("/api/consentimiento/retirar", json=cuerpo, headers=cab)

    def contar(self, **filtro):
        return EventoAnalitica.query.filter_by(**filtro).count()

    def crear_usuario_con_sesion(self):
        correo = f"consentimiento-{uuid.uuid4().hex[:8]}@test.com"
        self.correos.append(correo)
        with mock.patch("app.routes.auth.enviar_correo"):
            r = self.cliente.post("/api/auth/registro-email", json={"email": correo, "acepta_terminos": True})
        self.assertEqual(r.status_code, 201)
        return Usuario.query.filter_by(email=correo).first().id, r.get_json()["token"]

    # ------------------------------------------------------------ sin consentimiento
    def test_sin_consentimiento_no_se_guarda_ningun_evento(self):
        sid = self.nueva_sesion()
        r = self.evento(sid)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(r.get_json()["code"], "sin_consentimiento")
        self.assertEqual(self.contar(sesion_id=sid), 0)

    def test_rechazar_no_guarda_identificador_y_los_eventos_siguen_bloqueados(self):
        antes = ConsentimientoPrivacidad.query.filter_by(decision="rechazado").count()
        r = self.cliente.post("/api/consentimiento", json={"decision": "rechazado", "version": VERSION_CONSENTIMIENTO})
        self.assertEqual(r.status_code, 201)
        filas = ConsentimientoPrivacidad.query.filter_by(decision="rechazado").all()
        self.assertEqual(len(filas), antes + 1)
        self.assertTrue(all(f.sesion_id is None for f in filas))
        # aunque mande un sesion_id, un rechazo no lo guarda
        sid = self.nueva_sesion()
        self.cliente.post("/api/consentimiento", json={"decision": "rechazado", "version": VERSION_CONSENTIMIENTO, "sesion_id": sid})
        self.assertIsNone(ConsentimientoPrivacidad.query.filter_by(sesion_id=sid).first())
        self.assertEqual(self.evento(sid).status_code, 403)

    def test_version_desactualizada_se_rechaza(self):
        sid = self.nueva_sesion()
        r = self.cliente.post("/api/consentimiento", json={"decision": "aceptado", "version": "1999-01", "sesion_id": sid})
        self.assertEqual(r.status_code, 409)
        self.assertEqual(r.get_json()["code"], "version_desactualizada")

    def test_decision_o_sesion_invalidas(self):
        r = self.cliente.post("/api/consentimiento", json={"decision": "quiza", "version": VERSION_CONSENTIMIENTO})
        self.assertEqual(r.status_code, 400)
        r = self.cliente.post("/api/consentimiento", json={"decision": "aceptado", "version": VERSION_CONSENTIMIENTO, "sesion_id": "corto"})
        self.assertEqual(r.status_code, 400)

    # ------------------------------------------------------------ aceptar
    def test_aceptar_permite_eventos_y_registra_decision_fecha_y_version(self):
        sid = self.nueva_sesion()
        self.assertEqual(self.aceptar(sid).status_code, 201)
        fila = ConsentimientoPrivacidad.query.filter_by(sesion_id=sid).one()
        self.assertEqual((fila.decision, fila.version, fila.finalidad), ("aceptado", VERSION_CONSENTIMIENTO, "analitica"))
        self.assertIsNotNone(fila.decidido_en)
        self.assertEqual(self.evento(sid).status_code, 201)
        self.assertEqual(self.contar(sesion_id=sid), 1)

    def test_aceptar_dos_veces_no_duplica(self):
        sid = self.nueva_sesion()
        self.aceptar(sid)
        self.aceptar(sid)
        self.assertEqual(ConsentimientoPrivacidad.query.filter_by(sesion_id=sid).count(), 1)

    def test_un_sesion_id_ajeno_no_hereda_el_consentimiento(self):
        propio, ajeno = self.nueva_sesion(), self.nueva_sesion()
        self.aceptar(propio)
        self.assertEqual(self.evento(ajeno).status_code, 403)

    def test_consentimiento_de_version_anterior_deja_de_valer(self):
        sid = self.nueva_sesion()
        self.aceptar(sid)
        fila = ConsentimientoPrivacidad.query.filter_by(sesion_id=sid).one()
        fila.version = "v-prueba"
        db.session.commit()
        self.assertEqual(self.evento(sid).status_code, 403)

    def test_aceptar_no_rompe_el_registro_ni_el_login(self):
        # El flujo de cuenta es independiente del consentimiento (también funciona sin aceptar nada)
        uid, token = self.crear_usuario_con_sesion()
        r = self.cliente.get("/api/auth/perfil", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(r.status_code, 200)

    # ------------------------------------------------------------ retirar
    def test_retirar_borra_solo_lo_propio_y_quita_el_identificador(self):
        mia, otra = self.nueva_sesion(), self.nueva_sesion()
        self.aceptar(mia); self.aceptar(otra)
        self.evento(mia); self.evento(mia, tipo="vista_producto"); self.evento(otra)

        r = self.retirar(mia)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["eventos_eliminados"], 2)
        self.assertEqual(self.contar(sesion_id=mia), 0)
        self.assertEqual(self.contar(sesion_id=otra), 1, "no debe tocar los eventos de otra persona")

        self.assertIsNone(ConsentimientoPrivacidad.query.filter_by(sesion_id=mia).first(),
                          "el identificador se elimina de la fila")
        self.assertIsNotNone(ConsentimientoPrivacidad.query.filter_by(sesion_id=otra).first())
        self.assertEqual(self.evento(mia).status_code, 403, "tras retirar, ya no se recibe nada")

    def test_retirar_con_sesion_iniciada_borra_tambien_lo_asociado_a_su_cuenta_y_nada_mas(self):
        uid, token = self.crear_usuario_con_sesion()
        otro_uid, otro_token = self.crear_usuario_con_sesion()
        mia, otra = self.nueva_sesion(), self.nueva_sesion()
        self.aceptar(mia); self.aceptar(otra)
        self.evento(mia, token)                  # sesión mía, con mi cuenta
        self.evento(otra, token)                 # otro dispositivo mío (mi cuenta)
        self.evento(otra, otro_token)            # evento de OTRA persona en esa sesión ajena
        self.assertEqual(self.contar(usuario_id=uid), 2)

        self.retirar(mia, token)
        self.assertEqual(self.contar(usuario_id=uid), 0)
        self.assertEqual(self.contar(usuario_id=otro_uid), 1, "los eventos de otra cuenta se conservan")

    def test_retirar_sin_sesion_ni_cuenta_no_borra_nada(self):
        otra = self.nueva_sesion()
        self.aceptar(otra); self.evento(otra)
        r = self.retirar()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["eventos_eliminados"], 0)
        self.assertEqual(self.contar(sesion_id=otra), 1)

    def test_retirar_es_idempotente(self):
        sid = self.nueva_sesion()
        self.aceptar(sid)
        self.assertEqual(self.retirar(sid).status_code, 200)
        self.assertEqual(self.retirar(sid).status_code, 200)

    def test_tras_retirar_se_puede_volver_a_aceptar(self):
        sid = self.nueva_sesion()
        self.aceptar(sid); self.retirar(sid)
        self.assertEqual(self.aceptar(sid).status_code, 201)
        self.assertEqual(self.evento(sid).status_code, 201)

    # ------------------------------------------------------------ purga (retención)
    def test_la_purga_funciona_en_postgresql_y_respeta_los_plazos(self):
        viejo, nuevo = self.nueva_sesion(), self.nueva_sesion()
        self.aceptar(viejo); self.aceptar(nuevo)
        self.evento(viejo); self.evento(nuevo)
        EventoAnalitica.query.filter_by(sesion_id=viejo).update({"creado_en": datetime.utcnow() - timedelta(days=200)})
        ConsentimientoPrivacidad.query.filter_by(sesion_id=viejo).update({"decidido_en": datetime.utcnow() - timedelta(days=500)})
        db.session.commit()

        resultado = purgar_metricas_antiguas()
        self.assertIn("evento_analitica", resultado)
        self.assertEqual(self.contar(sesion_id=viejo), 0, "evento de 200 días: se purga (límite 180)")
        self.assertEqual(self.contar(sesion_id=nuevo), 1, "evento reciente: se conserva")
        self.assertIsNone(ConsentimientoPrivacidad.query.filter_by(sesion_id=viejo).first())
        self.assertIsNotNone(ConsentimientoPrivacidad.query.filter_by(sesion_id=nuevo).first())


if __name__ == "__main__":
    unittest.main()
