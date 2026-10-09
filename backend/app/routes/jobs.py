"""
Endpoints para jobs programados (cron), NO para el panel admin: no llevan
sesión de usuario ni cookies — se protegen con un secret compartido
(CRON_SECRET) que solo conoce el proceso que dispara el job.
"""
from flask import Blueprint, jsonify, request, current_app
from app.utils.pedidos_vencidos import cancelar_pedidos_vencidos_global

bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


def _autorizado():
    secret = current_app.config.get("CRON_SECRET")
    # Fail closed: si no hay CRON_SECRET configurado en este entorno, el
    # job rechaza TODO — nunca corre "abierto" por descuido.
    if not secret:
        return False

    auth_header = request.headers.get("Authorization", "")
    if auth_header == f"Bearer {secret}":
        return True

    return request.headers.get("X-Cron-Secret") == secret


@bp.route("/cancelar-pedidos-vencidos", methods=["GET", "POST"])
def cancelar_pedidos_vencidos():
    if request.method == "OPTIONS":
        return "", 200
    if not _autorizado():
        return jsonify({"error": "No autorizado"}), 403

    cancelados = cancelar_pedidos_vencidos_global()
    return jsonify({"pedidos_cancelados": cancelados})
