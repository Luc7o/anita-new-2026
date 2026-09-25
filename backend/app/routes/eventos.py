from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.extensions import db, limiter
from app.models import EventoAnalitica

bp = Blueprint("eventos", __name__, url_prefix="/api/eventos")


@bp.post("")
@limiter.limit("60 per minute")
def registrar_evento():
    """
    Registra un evento de analítica del embudo (vista de producto, agregar
    al carrito, inicio de checkout, compra completada, vista de página).
    No requiere sesión — se llama tanto para visitantes anónimos como para
    clientes logueados; si hay un JWT válido en la petición, se guarda el
    usuario_id, si no, queda NULL (solo con sesion_id).
    """
    data = request.get_json(force=True) or {}

    tipo_evento = data.get("tipo_evento")
    if tipo_evento not in EventoAnalitica.TIPOS:
        return jsonify({"error": "tipo_evento inválido"}), 400

    sesion_id = (data.get("sesion_id") or "").strip()[:64]
    if not sesion_id:
        return jsonify({"error": "Falta sesion_id"}), 400

    usuario_id = None
    try:
        verify_jwt_in_request(optional=True)
        identidad = get_jwt_identity()
        usuario_id = int(identidad) if identidad else None
    except Exception:
        usuario_id = None

    producto_id = data.get("producto_id")
    metadata = data.get("metadata")
    if metadata is not None and not isinstance(metadata, dict):
        metadata = None

    db.session.add(EventoAnalitica(
        tipo_evento=tipo_evento,
        producto_id=producto_id if isinstance(producto_id, int) else None,
        usuario_id=usuario_id,
        sesion_id=sesion_id,
        metadata_json=metadata,
    ))
    db.session.commit()
    return jsonify({"ok": True}), 201
