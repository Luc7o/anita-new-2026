import re
from datetime import datetime, timedelta
from decimal import Decimal

from flask import Blueprint, request, jsonify, g
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, selectinload

from app.extensions import db
from app.models import Compra, DetalleCompra, Proveedor
from app.roles import PUEDE_VER_COMPRAS, PUEDE_REGISTRAR_COMPRAS, PUEDE_ANULAR_COMPRAS
from app.utils.compras import ErrorCompra, registrar_compra, anular_compra
from app.utils.decorators import requiere_roles

bp = Blueprint("admin_compras", __name__, url_prefix="/api/admin/compras")

POR_PAGINA_MAX = 100


def _fecha(valor, fin_de_dia=False):
    if not valor:
        return None
    try:
        f = datetime.strptime(valor, "%Y-%m-%d")
    except ValueError:
        return None
    return f + timedelta(days=1) if fin_de_dia else f


@bp.get("")
@requiere_roles(*PUEDE_VER_COMPRAS)
def listar():
    """
    Lista de compras, de la más reciente a la más antigua.
    Filtros: proveedor_id, estado, desde, hasta (fecha de la compra, YYYY-MM-DD),
    q (número de compra C-000123, número de documento o nombre del proveedor).
    """
    filtros = []

    proveedor_id = request.args.get("proveedor_id", type=int)
    if proveedor_id:
        filtros.append(Compra.proveedor_id == proveedor_id)

    estado = request.args.get("estado")
    if estado:
        if estado not in Compra.ESTADOS:
            return jsonify({"error": "Estado no válido"}), 400
        filtros.append(Compra.estado == estado)

    desde = _fecha(request.args.get("desde"))
    if desde:
        filtros.append(Compra.fecha_compra >= desde.date())
    hasta = _fecha(request.args.get("hasta"))
    if hasta:
        filtros.append(Compra.fecha_compra <= hasta.date())

    q = (request.args.get("q") or "").strip()[:60]
    if q:
        condiciones = [
            Compra.numero_documento.ilike(f"%{q}%"),
            Compra.proveedor.has(Proveedor.nombre.ilike(f"%{q}%")),
        ]
        m = re.fullmatch(r"c-?0*(\d+)", q, flags=re.IGNORECASE)
        if m:
            condiciones.append(Compra.id == int(m.group(1)))
        filtros.append(or_(*condiciones))

    pagina = max(request.args.get("pagina", 1, type=int), 1)
    por_pagina = min(max(request.args.get("por_pagina", 20, type=int), 1), POR_PAGINA_MAX)

    base = Compra.query.filter(*filtros)
    total = base.count()
    compras = (
        base.options(joinedload(Compra.proveedor), joinedload(Compra.usuario))
        .order_by(Compra.fecha_compra.desc(), Compra.id.desc())
        .offset((pagina - 1) * por_pagina).limit(por_pagina).all()
    )

    # Monto de lo comprado (sin contar las anuladas) con los mismos filtros.
    monto = db.session.query(func.coalesce(func.sum(Compra.total), 0)).filter(
        *filtros, Compra.estado == "recibida"
    ).scalar()

    return jsonify({
        "compras": [c.to_dict() for c in compras],
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "paginas": max((total + por_pagina - 1) // por_pagina, 1),
        "monto_comprado": float(monto or 0),
    })


@bp.get("/<int:compra_id>")
@requiere_roles(*PUEDE_VER_COMPRAS)
def detalle(compra_id):
    compra = Compra.query.options(
        joinedload(Compra.proveedor), joinedload(Compra.usuario), joinedload(Compra.anulador),
        selectinload(Compra.detalles).joinedload(DetalleCompra.producto),
    ).get_or_404(compra_id)
    return jsonify(compra.to_dict(con_detalles=True))


@bp.post("")
@requiere_roles(*PUEDE_REGISTRAR_COMPRAS)
def crear():
    data = request.get_json(silent=True) or {}
    try:
        compra = registrar_compra(data, g.usuario.id)
        db.session.commit()
    except ErrorCompra as e:
        db.session.rollback()
        return jsonify({"error": e.mensaje}), e.status
    except IntegrityError as e:
        db.session.rollback()
        # Dos registros simultáneos del mismo documento: la base se queda con uno.
        if "uq_compras_documento" in str(e.orig):
            return jsonify({"error": "Ese documento ya fue registrado para este proveedor."}), 409
        raise
    except Exception:
        db.session.rollback()
        raise
    return jsonify(compra.to_dict(con_detalles=True)), 201


@bp.post("/<int:compra_id>/anular")
@requiere_roles(*PUEDE_ANULAR_COMPRAS)
def anular(compra_id):
    data = request.get_json(silent=True) or {}
    compra = Compra.query.get_or_404(compra_id)
    try:
        anular_compra(compra, g.usuario.id, data.get("motivo"))
        db.session.commit()
    except ErrorCompra as e:
        db.session.rollback()
        return jsonify({"error": e.mensaje}), e.status
    except Exception:
        db.session.rollback()
        raise
    return jsonify(compra.to_dict(con_detalles=True))
