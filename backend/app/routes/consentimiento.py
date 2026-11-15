import re
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from app.extensions import db, limiter
from app.models import ConsentimientoPrivacidad, EventoAnalitica
from app.utils.legal import VERSION_CONSENTIMIENTO

bp = Blueprint("consentimiento", __name__, url_prefix="/api/consentimiento")

# El identificador de estadísticas lo genera el navegador (UUID) SOLO tras aceptar.
_SESION_VALIDA = re.compile(r"^[A-Za-z0-9-]{16,64}$")


def _sesion_de(data):
    sesion_id = (data.get("sesion_id") or "").strip()
    return sesion_id if _SESION_VALIDA.match(sesion_id) else None


def _usuario_actual():
    """Usuario de la petición si trae un JWT válido; si no, None (no se exige sesión)."""
    try:
        verify_jwt_in_request(optional=True)
        identidad = get_jwt_identity()
        return int(identidad) if identidad else None
    except Exception:  # noqa: BLE001
        return None


@bp.post("")
@limiter.limit("30 per hour")
def registrar_decision():
    """
    Deja constancia de la decisión sobre las estadísticas de uso.

    - aceptado : requiere el sesion_id (que el navegador acaba de generar por esta
                 aceptación). Si ya existía, se actualiza la fecha y la versión.
    - rechazado: NO se guarda ningún identificador, solo la decisión, la versión y la fecha.
    Esto no es analítica ni lleva cookies: solo prueba la decisión de la persona.
    """
    data = request.get_json(force=True, silent=True) or {}

    decision = data.get("decision")
    if decision not in ("aceptado", "rechazado"):
        return jsonify({"error": "decision inválida"}), 400

    if data.get("version") != VERSION_CONSENTIMIENTO:
        return jsonify({
            "error": "La versión del aviso de privacidad cambió. Recarga la página e inténtalo de nuevo.",
            "code": "version_desactualizada",
        }), 409

    if decision == "rechazado":
        db.session.add(ConsentimientoPrivacidad(decision="rechazado", version=VERSION_CONSENTIMIENTO))
        db.session.commit()
        return jsonify({"ok": True}), 201

    sesion_id = _sesion_de(data)
    if not sesion_id:
        return jsonify({"error": "Falta un sesion_id válido"}), 400

    ahora = datetime.utcnow()
    fila = ConsentimientoPrivacidad.query.filter_by(sesion_id=sesion_id).first()
    if fila:
        fila.version = VERSION_CONSENTIMIENTO
        fila.decidido_en = ahora
    else:
        db.session.add(ConsentimientoPrivacidad(
            decision="aceptado", version=VERSION_CONSENTIMIENTO, sesion_id=sesion_id, decidido_en=ahora,
        ))
    try:
        db.session.commit()
    except IntegrityError:  # dos peticiones a la vez con el mismo sesion_id
        db.session.rollback()
        fila = ConsentimientoPrivacidad.query.filter_by(sesion_id=sesion_id).first()
        if fila:
            fila.version = VERSION_CONSENTIMIENTO
            fila.decidido_en = ahora
            db.session.commit()
    return jsonify({"ok": True}), 201


@bp.post("/retirar")
@limiter.limit("20 per hour")
def retirar_consentimiento():
    """
    Retira el consentimiento y borra los datos recogidos con él. Solo se tocan datos de
    QUIEN lo pide:
      - los eventos de su identificador de estadísticas (sesion_id, un UUID imposible de
        adivinar: solo lo tiene este navegador), y
      - si además tiene la sesión iniciada, los eventos asociados a su propia cuenta.
    Nunca se borra nada de otras personas. En la fila del consentimiento se elimina el
    identificador y queda solo la decisión (retirado) con su fecha.
    """
    data = request.get_json(force=True, silent=True) or {}
    sesion_id = _sesion_de(data)
    usuario_id = _usuario_actual()

    eliminados = 0
    if sesion_id:
        eliminados += EventoAnalitica.query.filter_by(sesion_id=sesion_id).delete(synchronize_session=False)
    if usuario_id:
        eliminados += EventoAnalitica.query.filter_by(usuario_id=usuario_id).delete(synchronize_session=False)

    if sesion_id:
        fila = ConsentimientoPrivacidad.query.filter_by(sesion_id=sesion_id).first()
        if fila:
            fila.decision = "retirado"
            fila.sesion_id = None
            fila.retirado_en = datetime.utcnow()

    db.session.commit()
    return jsonify({"ok": True, "eventos_eliminados": eliminados}), 200
