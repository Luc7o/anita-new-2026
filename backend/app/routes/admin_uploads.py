from flask import Blueprint, request, jsonify
from app.utils.decorators import requiere_roles
from app.utils.imagenes import guardar_imagen, ImagenInvalida
from app.roles import PUEDE_GESTIONAR_PRODUCTOS, PUEDE_GESTIONAR_USUARIOS, PUEDE_GESTIONAR_PROMOCIONES

bp = Blueprint("admin_uploads", __name__, url_prefix="/api/admin/uploads")


@bp.post("/producto-imagen")
@requiere_roles(*PUEDE_GESTIONAR_PRODUCTOS)
def subir_imagen_producto():
    try:
        url = guardar_imagen(request.files.get("imagen"), "productos")
    except ImagenInvalida as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"url": url}), 201


@bp.post("/promocion-imagen")
@requiere_roles(*PUEDE_GESTIONAR_PROMOCIONES)
def subir_imagen_promocion():
    try:
        url = guardar_imagen(request.files.get("imagen"), "promociones")
    except ImagenInvalida as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"url": url}), 201


@bp.post("/qr-pago")
@requiere_roles(*PUEDE_GESTIONAR_USUARIOS)
def subir_qr_pago():
    try:
        url = guardar_imagen(request.files.get("imagen"), "pagos")
    except ImagenInvalida as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"url": url}), 201
