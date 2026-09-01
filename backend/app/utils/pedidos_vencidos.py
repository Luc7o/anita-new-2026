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

# Mismo set que METODOS_PAGO_PASARELA en app/routes/pedidos.py — se
# duplica acá (en vez de importarlo) para no crear un import circular
# entre pedidos.py y este módulo.
_METODOS_PAGO_PASARELA = {"tarjeta", "yape"}


def _cancelar_uno(pedido):
    pedido.estado = "cancelado"
    pedido.estado_pago = "rechazado"
    restaurar_stock_de_pedido(pedido)


def _query_vencidos(usuario_id=None):
    query = Pedido.query.filter(
        Pedido.estado_pago == "pendiente",
        Pedido.metodo_pago.in_(_METODOS_PAGO_PASARELA),
        Pedido.fecha_limite_pago.isnot(None),
        Pedido.fecha_limite_pago < datetime.utcnow(),
    )
    if usuario_id is not None:
        query = query.filter(Pedido.usuario_id == usuario_id)
    return query


def cancelar_pedidos_vencidos_del_usuario(usuario_id):
    """Chequeo lazy y barato: solo mira los pedidos de ESTE usuario.
    Se usa antes de listar/consultar sus pedidos o de intentar pagar uno."""
    vencidos = _query_vencidos(usuario_id=usuario_id).with_for_update().all()
    for pedido in vencidos:
        _cancelar_uno(pedido)
    if vencidos:
        db.session.commit()
    return len(vencidos)


def cancelar_pedidos_vencidos_global():
    """Barrido completo — pensado para correr desde un cron / job externo."""
    vencidos = _query_vencidos().with_for_update().all()
    for pedido in vencidos:
        _cancelar_uno(pedido)
    if vencidos:
        db.session.commit()
    return len(vencidos)
