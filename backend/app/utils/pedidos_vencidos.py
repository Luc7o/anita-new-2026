"""
Libera el stock reservado por pedidos de pasarela (tarjeta/Yape) que nunca
se llegaron a pagar.

El checkout descuenta stock de inmediato (antes de que Culqi confirme el
cobro) para que dos compradores no vean el mismo stock disponible mientras
uno de ellos ya está pagando. Eso significa que un pedido abandonado a
medio pagar deja ese stock "atrapado" — este módulo lo devuelve pasado
`fecha_limite_pago`.

Se llama desde dos lugares:
1. `cancelar_pedidos_vencidos_del_usuario`: chequeo "lazy", barato, acotado
   a un usuario — se ejecuta en caliente cada vez que ese usuario consulta
   sus pedidos, así el catálogo se autolimpia con el tráfico normal aunque
   nunca corra un cron.
2. `cancelar_pedidos_vencidos_global`: barre TODOS los pedidos vencidos del
   sistema, sin importar el usuario — pensado para el endpoint de cron
   (`app/routes/jobs.py`), que sí puede tocar pedidos de cualquier cliente.
"""
from datetime import datetime
from app.extensions import db
from app.models import Pedido
from app.utils.stock import restaurar_stock_de_pedido
from app.utils.historial import cambiar_estado_pedido
from app.utils.notificaciones import MAX_AVISOS_VENCIDOS_POR_PASADA, notificar_estado_pedido

# Tarjeta y Yape se cobran por la pasarela Culqi (cargo único, síncrono).
# Única definición: la usan el checkout (routes/pedidos.py) y este módulo.
METODOS_PAGO_PASARELA = {"tarjeta", "yape"}


def _cancelar_uno(pedido):
    pedido.estado_pago = "rechazado"
    pedido.motivo_cancelacion = "vencimiento_pago"
    cambiar_estado_pedido(pedido, "cancelado")
    restaurar_stock_de_pedido(pedido)


def _query_vencidos(usuario_id=None):
    query = Pedido.query.filter(
        Pedido.estado_pago == "pendiente",
        Pedido.metodo_pago.in_(METODOS_PAGO_PASARELA),
        Pedido.fecha_limite_pago.isnot(None),
        Pedido.fecha_limite_pago < datetime.utcnow(),
    )
    if usuario_id is not None:
        query = query.filter(Pedido.usuario_id == usuario_id)
    return query


def _cancelar_y_avisar(vencidos):
    """Cancela los pedidos, confirma y RECIÉN ahí avisa a cada cliente por correo
    (un pedido que no se pudo guardar como cancelado no debe avisar nada)."""
    for pedido in vencidos:
        _cancelar_uno(pedido)
    if not vencidos:
        return 0
    db.session.commit()
    for pedido in vencidos[:MAX_AVISOS_VENCIDOS_POR_PASADA]:
        notificar_estado_pedido(pedido)
    return len(vencidos)


def cancelar_pedidos_vencidos_del_usuario(usuario_id):
    """Chequeo lazy y barato: solo mira los pedidos de ESTE usuario.
    Se usa antes de listar/consultar sus pedidos o de intentar pagar uno."""
    return _cancelar_y_avisar(_query_vencidos(usuario_id=usuario_id).with_for_update().all())


def cancelar_pedidos_vencidos_global():
    """Barrido completo — pensado para correr desde un cron / job externo."""
    return _cancelar_y_avisar(_query_vencidos().with_for_update().all())
