from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, Response

from app.extensions import db
from app.models import Pedido
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_DASHBOARD_VENTAS
from app.utils.reporte_ventas import generar_pdf_reporte_ventas

bp = Blueprint("admin_reportes", __name__, url_prefix="/api/admin/reportes")


@bp.get("/ventas")
@requiere_roles(*PUEDE_VER_DASHBOARD_VENTAS)
def reporte_ventas():
    desde_str = (request.args.get("desde") or "").strip() or None
    hasta_str = (request.args.get("hasta") or "").strip() or None

    try:
        desde = datetime.strptime(desde_str, "%Y-%m-%d") if desde_str else None
        # +1 día para que "hasta" incluya todo ese día completo, no solo su medianoche.
        hasta = datetime.strptime(hasta_str, "%Y-%m-%d") + timedelta(days=1) if hasta_str else None
    except ValueError:
        return jsonify({"error": "Fechas inválidas, usa el formato YYYY-MM-DD"}), 400

    # Mismo criterio de "venta confirmada" que ya usa el dashboard en
    # estadisticas(): pago verificado, o métodos que no requieren
    # verificación pero solo una vez entregado.
    query = Pedido.query.filter(
        db.or_(
            Pedido.estado_pago == "verificado",
            db.and_(Pedido.estado_pago == "no_aplica", Pedido.estado == "entregado"),
        )
    )
    if desde:
        query = query.filter(Pedido.fecha_creacion >= desde)
    if hasta:
        query = query.filter(Pedido.fecha_creacion < hasta)

    pedidos = query.order_by(Pedido.fecha_creacion.asc()).all()

    pdf_bytes = generar_pdf_reporte_ventas(pedidos, desde_str, hasta_str)
    nombre_archivo = f"reporte-ventas-{desde_str or 'inicio'}-a-{hasta_str or 'hoy'}.pdf"
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename={nombre_archivo}"},
    )