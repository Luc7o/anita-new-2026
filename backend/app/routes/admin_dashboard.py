"""
Panel "Necesita tu atención" del dashboard.

A diferencia de las estadísticas (que son números para mirar), esto es una
lista corta de cosas pendientes que alguien tiene que hacer hoy, con enlace
directo. Cada rol recibe SOLO los pendientes de las áreas que puede ver:
un Almacén no ve reclamos, un Soporte no ve stock, etc. (permisos en
app/roles.py). Por eso este endpoint está abierto a todos los roles del panel
y es el servidor quien decide qué entra en la respuesta.
"""
from datetime import datetime, timedelta

from flask import Blueprint, g, jsonify
from sqlalchemy.orm import selectinload

from app.models import Pedido, Producto, Reclamacion
from app.roles import (
    ROLES_ADMIN,
    PUEDE_VER_PEDIDOS,
    PUEDE_VER_PRODUCTOS,
    PUEDE_VER_RECLAMACIONES,
)
from app.utils.decorators import requiere_roles

bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/admin/dashboard")

# Un reclamo "por vencer" es uno cuyo plazo legal termina en esta cantidad de
# días corridos o menos.
DIAS_AVISO_RECLAMO = 3
# Mismo umbral que ya usaba el dashboard para "bajo stock".
UMBRAL_BAJO_STOCK = 3


def _item(clave, cantidad, singular, plural, enlace, urgente):
    return {
        "clave": clave,
        "cantidad": cantidad,
        "texto": f"{cantidad} {singular if cantidad == 1 else plural}",
        "enlace": enlace,
        "urgente": urgente,
    }


@bp.get("/atencion")
@requiere_roles(*ROLES_ADMIN)
def atencion():
    rol = g.usuario.rol
    items = []

    if rol in PUEDE_VER_RECLAMACIONES:
        hoy = (datetime.utcnow() - timedelta(hours=5)).date()  # hora de Perú
        pendientes = Reclamacion.query.filter_by(estado="pendiente").all()
        vencidos = sum(1 for r in pendientes if r.fecha_limite < hoy)
        por_vencer = sum(
            1 for r in pendientes
            if 0 <= (r.fecha_limite - hoy).days <= DIAS_AVISO_RECLAMO
        )
        al_dia = len(pendientes) - vencidos - por_vencer
        link = "/admin/reclamaciones"
        if vencidos:
            items.append(_item("reclamos_vencidos", vencidos,
                               "reclamo con el plazo vencido", "reclamos con el plazo vencido", link, True))
        if por_vencer:
            items.append(_item("reclamos_por_vencer", por_vencer,
                               "reclamo por vencer (3 días o menos)", "reclamos por vencer (3 días o menos)", link, True))
        if al_dia:
            items.append(_item("reclamos_pendientes", al_dia,
                               "reclamo por responder", "reclamos por responder", link, False))

    if rol in PUEDE_VER_PEDIDOS:
        link = "/admin/pedidos"
        reembolsos = Pedido.query.filter_by(estado_pago="reembolso_pendiente").count()
        revisar = Pedido.query.filter_by(estado_pago="en_revision").count()
        pendientes = Pedido.query.filter_by(estado="pendiente").count()
        if reembolsos:
            items.append(_item("reembolsos_pendientes", reembolsos,
                               "reembolso pendiente", "reembolsos pendientes", link, True))
        if revisar:
            items.append(_item("pagos_por_revisar", revisar,
                               "pago por revisar", "pagos por revisar", link, False))
        if pendientes:
            items.append(_item("pedidos_pendientes", pendientes,
                               "pedido pendiente", "pedidos pendientes", link, False))

    if rol in PUEDE_VER_PRODUCTOS:
        link = "/admin/productos"
        stocks = [
            p.stock_total
            for p in Producto.query.filter_by(activo=True).options(selectinload(Producto.variantes)).all()
        ]
        sin_stock = sum(1 for s in stocks if s <= 0)
        bajo_stock = sum(1 for s in stocks if 0 < s <= UMBRAL_BAJO_STOCK)
        if sin_stock:
            items.append(_item("productos_sin_stock", sin_stock,
                               "producto sin stock", "productos sin stock", link, True))
        if bajo_stock:
            items.append(_item("productos_bajo_stock", bajo_stock,
                               "producto con poco stock (3 o menos)", "productos con poco stock (3 o menos)", link, False))

    # Lo urgente primero; dentro de cada grupo se respeta el orden de arriba.
    items.sort(key=lambda i: not i["urgente"])
    return jsonify({"items": items})
