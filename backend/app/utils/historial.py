"""
KPIs: helper único para cambiar pedidos.estado. Centralizarlo acá (en vez
de asignar pedido.estado = X directo en cada endpoint) es lo que garantiza
que CADA transición quede en historial_estado_pedido sin tener que acordarse
de repetir el insert en cada punto del código que mueve el estado de un
pedido.
"""
from app.extensions import db
from app.models import HistorialEstadoPedido


def cambiar_estado_pedido(pedido, estado_nuevo, cambiado_por=None):
    """
    Cambia pedido.estado a estado_nuevo y deja constancia en
    historial_estado_pedido. No valida transición (eso lo sigue haciendo
    pedido.puede_pasar_a() en el caller, antes de llamar a esto) ni hace
    commit (lo hace el caller, junto con el resto de cambios de esa misma
    petición).

    Si estado_nuevo es igual al estado actual, no hace nada (evita filas de
    historial sin sentido tipo "confirmado -> confirmado").
    """
    estado_anterior = pedido.estado
    if estado_anterior == estado_nuevo:
        return

    pedido.estado = estado_nuevo
    db.session.add(HistorialEstadoPedido(
        pedido_id=pedido.id,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        cambiado_por=cambiado_por,
    ))
