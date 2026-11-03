from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from app.models import MovimientoStock
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_MOVIMIENTOS

bp = Blueprint("admin_movimientos", __name__, url_prefix="/api/admin/movimientos")

POR_PAGINA_MAX = 100


def _fecha(valor, fin_de_dia=False):
    """Convierte 'YYYY-MM-DD' en datetime. Devuelve None si viene vacío o inválido."""
    if not valor:
        return None
    try:
        f = datetime.strptime(valor, "%Y-%m-%d")
    except ValueError:
        return None
    return f + timedelta(days=1) if fin_de_dia else f


@bp.get("")
@requiere_roles(*PUEDE_VER_MOVIMIENTOS)
def listar():
    """
    Historial de movimientos de stock (kardex), del más reciente al más antiguo.

    Filtros opcionales: producto_id, variante_id, tipo, usuario_id, pedido_id,
    desde y hasta (YYYY-MM-DD, hasta inclusivo), pagina y por_pagina.
    """
    q = MovimientoStock.query.options(
        joinedload(MovimientoStock.producto),
        joinedload(MovimientoStock.variante),
        joinedload(MovimientoStock.usuario),
    )

    for campo in ("producto_id", "variante_id", "usuario_id", "pedido_id"):
        valor = request.args.get(campo, type=int)
        if valor is not None:
            q = q.filter(getattr(MovimientoStock, campo) == valor)

    tipo = request.args.get("tipo")
    if tipo:
        if tipo not in MovimientoStock.TIPOS:
            return jsonify({"error": "Tipo de movimiento no válido"}), 400
        q = q.filter(MovimientoStock.tipo == tipo)

    desde = _fecha(request.args.get("desde"))
    if desde:
        q = q.filter(MovimientoStock.fecha_creacion >= desde)
    hasta = _fecha(request.args.get("hasta"), fin_de_dia=True)
    if hasta:
        q = q.filter(MovimientoStock.fecha_creacion < hasta)

    pagina = max(request.args.get("pagina", 1, type=int), 1)
    por_pagina = min(max(request.args.get("por_pagina", 25, type=int), 1), POR_PAGINA_MAX)

    total = q.count()
    movimientos = (
        q.order_by(MovimientoStock.fecha_creacion.desc(), MovimientoStock.id.desc())
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
        .all()
    )

    return jsonify({
        "movimientos": [m.to_dict() for m in movimientos],
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "paginas": max((total + por_pagina - 1) // por_pagina, 1),
        "tipos": [{"valor": t, "etiqueta": MovimientoStock.ETIQUETAS[t]} for t in MovimientoStock.TIPOS],
    })
