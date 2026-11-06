from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, Response

from app.extensions import db
from sqlalchemy.orm import joinedload, selectinload

from app.models import Pedido, Producto, Usuario, MovimientoStock
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_DASHBOARD_VENTAS, PUEDE_GESTIONAR_STOCK, PUEDE_VER_MOVIMIENTOS, PUEDE_VER_COSTOS
from app.utils.reporte_ventas import generar_pdf_reporte_ventas
from app.utils.reporte_inventario import generar_pdf_reporte_inventario
from app.utils.reporte_clientes import generar_pdf_reporte_clientes
from app.utils.reporte_almacen import generar_pdf_kardex, generar_pdf_valorizacion, generar_pdf_margen

OFFSET_UTC_LIMA = timedelta(hours=5)

bp = Blueprint("admin_reportes", __name__, url_prefix="/api/admin/reportes")


@bp.get("/ventas")
@requiere_roles(*PUEDE_VER_DASHBOARD_VENTAS)
def reporte_ventas():
    desde_str = (request.args.get("desde") or "").strip() or None
    hasta_str = (request.args.get("hasta") or "").strip() or None

    try:
        # Las fechas del formulario son días de Lima (UTC-5) y fecha_creacion
        # se guarda en UTC: medianoche en Lima = 05:00 UTC, por eso el +5h.
        desde = datetime.strptime(desde_str, "%Y-%m-%d") + OFFSET_UTC_LIMA if desde_str else None
        # +1 día para que "hasta" incluya todo ese día completo, no solo su medianoche.
        hasta = (
            datetime.strptime(hasta_str, "%Y-%m-%d") + timedelta(days=1) + OFFSET_UTC_LIMA
            if hasta_str else None
        )
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

def _rango_de_fechas():
    """Lee desde/hasta de la URL. Devuelve (desde_str, hasta_str, desde_utc, hasta_utc)."""
    desde_str = (request.args.get("desde") or "").strip() or None
    hasta_str = (request.args.get("hasta") or "").strip() or None
    desde = datetime.strptime(desde_str, "%Y-%m-%d") + OFFSET_UTC_LIMA if desde_str else None
    hasta = (
        datetime.strptime(hasta_str, "%Y-%m-%d") + timedelta(days=1) + OFFSET_UTC_LIMA
        if hasta_str else None
    )
    return desde_str, hasta_str, desde, hasta


def _pdf(pdf_bytes, nombre_archivo):
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f"inline; filename={nombre_archivo}"},
    )


@bp.get("/inventario")
@requiere_roles(*PUEDE_GESTIONAR_STOCK)
def reporte_inventario():
    solo_alerta = request.args.get("solo_alerta") == "1"
    productos = Producto.query.order_by(Producto.nombre.asc()).all()
    pdf_bytes = generar_pdf_reporte_inventario(productos, solo_alerta)
    return _pdf(pdf_bytes, "reporte-inventario.pdf")


@bp.get("/clientes")
@requiere_roles(*PUEDE_VER_DASHBOARD_VENTAS)
def reporte_clientes():
    try:
        desde_str, hasta_str, desde, hasta = _rango_de_fechas()
    except ValueError:
        return jsonify({"error": "Fechas inválidas, usa el formato YYYY-MM-DD"}), 400

    # Mismo criterio de "venta confirmada" que el reporte de ventas.
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
    pedidos = query.all()

    clientes = (
        Usuario.clientes().filter_by(es_invitado=False)
        .order_by(Usuario.fecha_registro.desc())
        .all()
    )
    usuarios_por_id = {u.id: u for u in clientes}
    faltan = {p.usuario_id for p in pedidos if p.usuario_id} - set(usuarios_por_id)
    if faltan:
        for u in Usuario.query.filter(Usuario.id.in_(faltan)).all():
            usuarios_por_id[u.id] = u

    pdf_bytes = generar_pdf_reporte_clientes(clientes, pedidos, usuarios_por_id, desde, hasta, desde_str, hasta_str)
    return _pdf(pdf_bytes, f"reporte-clientes-{desde_str or 'inicio'}-a-{hasta_str or 'hoy'}.pdf")


KARDEX_MAX_MOVIMIENTOS = 3000


@bp.get("/kardex")
@requiere_roles(*PUEDE_VER_MOVIMIENTOS)
def reporte_kardex():
    """Kardex en PDF de un producto (todas sus variantes, o una sola con variante_id)."""
    producto_id = request.args.get("producto_id", type=int)
    if not producto_id:
        return jsonify({"error": "Elige el producto del kardex"}), 400
    producto = Producto.query.options(selectinload(Producto.variantes)).get(producto_id)
    if not producto:
        return jsonify({"error": "El producto no existe"}), 404

    try:
        desde_str, hasta_str, desde, hasta = _rango_de_fechas()
    except ValueError:
        return jsonify({"error": "Fechas inválidas, usa el formato YYYY-MM-DD"}), 400

    query = MovimientoStock.query.options(
        joinedload(MovimientoStock.variante), joinedload(MovimientoStock.usuario),
    ).filter(MovimientoStock.producto_id == producto.id)

    variante_etiqueta = None
    variante_id = request.args.get("variante_id", type=int)
    if variante_id:
        variante = next((v for v in producto.variantes if v.id == variante_id), None)
        if not variante:
            return jsonify({"error": "La variante no pertenece a ese producto"}), 400
        query = query.filter(MovimientoStock.variante_id == variante_id)
        variante_etiqueta = " · ".join(x for x in (f"Talla {variante.talla}" if variante.talla else None, variante.color) if x) or None

    if desde:
        query = query.filter(MovimientoStock.fecha_creacion >= desde)
    if hasta:
        query = query.filter(MovimientoStock.fecha_creacion < hasta)

    movimientos = (
        query.order_by(MovimientoStock.fecha_creacion.asc(), MovimientoStock.id.asc())
        .limit(KARDEX_MAX_MOVIMIENTOS + 1).all()
    )
    truncado = len(movimientos) > KARDEX_MAX_MOVIMIENTOS
    movimientos = movimientos[:KARDEX_MAX_MOVIMIENTOS]

    pdf_bytes = generar_pdf_kardex(producto, movimientos, desde_str, hasta_str, truncado, variante_etiqueta)
    return _pdf(pdf_bytes, f"kardex-{producto.sku or producto.id}.pdf")


@bp.get("/valorizacion")
@requiere_roles(*PUEDE_VER_COSTOS)
def reporte_valorizacion():
    productos = Producto.query.options(
        selectinload(Producto.variantes), joinedload(Producto.categoria),
    ).order_by(Producto.nombre.asc()).all()
    return _pdf(generar_pdf_valorizacion(productos), "valorizacion-inventario.pdf")


@bp.get("/margen")
@requiere_roles(*PUEDE_VER_COSTOS)
def reporte_margen():
    try:
        desde_str, hasta_str, desde, hasta = _rango_de_fechas()
    except ValueError:
        return jsonify({"error": "Fechas inválidas, usa el formato YYYY-MM-DD"}), 400

    # Mismo criterio de "venta confirmada" que el reporte de ventas.
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
    pdf_bytes = generar_pdf_margen(pedidos, desde_str, hasta_str)
    return _pdf(pdf_bytes, f"margen-{desde_str or 'inicio'}-a-{hasta_str or 'hoy'}.pdf")
