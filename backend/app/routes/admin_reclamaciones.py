"""Libro de Reclamaciones — panel admin: listar, ver, responder y descargar la hoja."""
from datetime import datetime

from flask import Blueprint, Response, current_app, g, jsonify, request

from app.extensions import db
from app.models import Reclamacion
from app.roles import PUEDE_GESTIONAR_RECLAMACIONES, PUEDE_VER_RECLAMACIONES
from app.utils.correo import enviar_correo
from app.utils.decorators import requiere_roles
from app.utils.hoja_reclamacion import generar_pdf_hoja

bp = Blueprint("admin_reclamaciones", __name__, url_prefix="/api/admin/reclamaciones")


@bp.get("")
@requiere_roles(*PUEDE_VER_RECLAMACIONES)
def listar():
    query = Reclamacion.query
    estado = request.args.get("estado")
    if estado in ("pendiente", "respondido"):
        query = query.filter_by(estado=estado)
    # Lo más urgente primero: los pendientes por fecha límite, luego lo más reciente.
    reclamos = query.order_by(Reclamacion.estado.asc(), Reclamacion.fecha_limite.asc(), Reclamacion.id.desc()).all()
    return jsonify({"reclamaciones": [r.to_dict() for r in reclamos]})


@bp.get("/<int:reclamo_id>")
@requiere_roles(*PUEDE_VER_RECLAMACIONES)
def detalle(reclamo_id):
    return jsonify(Reclamacion.query.get_or_404(reclamo_id).to_dict())


@bp.get("/<int:reclamo_id>/pdf")
@requiere_roles(*PUEDE_VER_RECLAMACIONES)
def descargar_hoja(reclamo_id):
    reclamo = Reclamacion.query.get_or_404(reclamo_id)
    return Response(
        generar_pdf_hoja(reclamo),
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename=hoja-reclamacion-{reclamo.codigo}.pdf"},
    )


@bp.post("/<int:reclamo_id>/responder")
@requiere_roles(*PUEDE_GESTIONAR_RECLAMACIONES)
def responder(reclamo_id):
    reclamo = Reclamacion.query.get_or_404(reclamo_id)
    if reclamo.estado == "respondido":
        return jsonify({"error": "Este reclamo ya fue respondido"}), 409

    data = request.get_json(silent=True) or {}
    respuesta = (data.get("respuesta") or "").strip()
    if len(respuesta) < 10:
        return jsonify({"error": "Escribe la respuesta al consumidor (mínimo 10 caracteres)"}), 400
    if len(respuesta) > 3000:
        return jsonify({"error": "La respuesta no puede pasar de 3000 caracteres"}), 400

    reclamo.respuesta = respuesta
    reclamo.estado = "respondido"
    reclamo.fecha_respuesta = datetime.utcnow()
    reclamo.respondido_por = g.usuario.id
    db.session.commit()

    email_enviado = False
    try:
        pdf_bytes = generar_pdf_hoja(reclamo)
        email_enviado, _ = enviar_correo(
            reclamo.consumidor_email,
            f"Respuesta a tu {reclamo.tipo} N° {reclamo.codigo}",
            (
                f"Hola {reclamo.consumidor_nombre},\n\n"
                f"Respondimos tu {reclamo.tipo} N° {reclamo.codigo}:\n\n{respuesta}\n\n"
                "Adjuntamos tu hoja de reclamación con la respuesta.\n\nAnita New Style"
            ),
            adjuntos=[(f"hoja-reclamacion-{reclamo.codigo}.pdf", pdf_bytes)],
        )
    except Exception as e:
        current_app.logger.error(f"No se pudo enviar la respuesta del reclamo {reclamo.codigo}: {e}")

    resultado = reclamo.to_dict()
    resultado["email_enviado"] = bool(email_enviado)
    return jsonify(resultado)
