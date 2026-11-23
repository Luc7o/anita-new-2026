"""
Libera el stock reservado por pedidos de pasarela (tarjeta/Yape) que nunca
se llegaron a pagar.

El checkout descuenta stock de inmediato (antes de que Culqi confirme el
cobro) para que dos compradores no vean el mismo stock disponible mientras
uno de ellos ya está pagando. Eso significa que un pedido abandonado a
medio pagar deja ese stock "atrapado" — este módulo lo devuelve pasado
`fecha_limite_pago`.

Se llama desde tres lugares:
1. `cancelar_pedidos_vencidos_del_usuario`: chequeo "lazy", barato, acotado
   a un usuario — se ejecuta en caliente cada vez que ese usuario consulta
   sus pedidos, así el catálogo se autolimpia con el tráfico normal aunque
   nunca corra un cron.
2. `cancelar_pedidos_vencidos_global`: barre TODOS los pedidos vencidos del
   sistema, sin importar el usuario — pensado para el endpoint de cron
   (`app/routes/jobs.py`), que sí puede tocar pedidos de cualquier cliente.
3. `liberar_vencidos_si_toca`: el mismo barrido global, pero disparado por el
   tráfico de la tienda (ver el catálogo o un producto, agregar al carrito,
   validar carrito, checkout) y como
   mucho una vez por minuto. Así el stock que dejó atrapado un cliente vuelve
   a estar disponible para los demás a los ~20 minutos, sin depender del cron
   diario ni de que ese cliente regrese.
"""
import logging
import time
from functools import wraps

from datetime import datetime

from flask import current_app

from app.extensions import db
from app.models import Pedido
from app.utils.stock import restaurar_stock_de_pedido
from app.utils.historial import cambiar_estado_pedido
from app.utils.notificaciones import MAX_AVISOS_VENCIDOS_POR_PASADA, notificar_estado_pedido
from app.utils.cache import _cliente_redis, _fallo_redis, invalidar_cache_publico

log = logging.getLogger(__name__)

# Barrido disparado por el tráfico: cada cuánto como máximo (entre TODAS las
# instancias si hay Redis; config SEGUNDOS_ENTRE_BARRIDOS_VENCIDOS, 60 por
# defecto) y cuántos pedidos como máximo por pasada, para que la petición de un
# cliente nunca cargue con un barrido grande.
MAX_PEDIDOS_POR_BARRIDO_EN_CALIENTE = 10
_CLAVE_BARRIDO = "ans:barrido_vencidos"
_ultimo_barrido_local = 0.0

# Tarjeta y Yape se cobran por la pasarela Culqi (cargo único, síncrono).
# Única definición: la usan el checkout (routes/pedidos.py) y este módulo.
METODOS_PAGO_PASARELA = {"tarjeta", "yape"}


def _cancelar_uno(pedido):
    # Defensa extra: nunca se cancela (ni se devuelve stock de) un pedido que ya avanzó.
    if not pedido.puede_pasar_a("cancelado"):
        return
    pedido.estado_pago = "rechazado"
    pedido.motivo_cancelacion = "vencimiento_pago"
    cambiar_estado_pedido(pedido, "cancelado")
    restaurar_stock_de_pedido(pedido, motivo="Vencimiento del plazo de pago")


def _query_vencidos(usuario_id=None):
    query = Pedido.query.filter(
        # Solo pedidos que siguen esperando el pago. Uno ya confirmado, preparado o enviado no
        # se toca aunque su plazo haya pasado: devolver su stock inflaría el inventario.
        Pedido.estado == "pendiente",
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
    return _cancelar_y_avisar(_query_vencidos(usuario_id=usuario_id).with_for_update(of=Pedido).all())


def cancelar_pedidos_vencidos_global():
    """Barrido completo — pensado para correr desde un cron / job externo."""
    return _cancelar_y_avisar(_query_vencidos().with_for_update(of=Pedido).all())


def _toca_barrer():
    """True como mucho una vez cada SEGUNDOS_ENTRE_BARRIDOS_VENCIDOS. Con Redis el turno
    es compartido por todas las instancias (SET NX con vencimiento); sin Redis,
    cada proceso lleva su propia cuenta."""
    global _ultimo_barrido_local
    segundos = current_app.config.get("SEGUNDOS_ENTRE_BARRIDOS_VENCIDOS", 60)
    if segundos <= 0:
        return True
    r = _cliente_redis()
    if r is not None:
        try:
            return bool(r.set(_CLAVE_BARRIDO, b"1", nx=True, ex=segundos))
        except Exception as exc:  # noqa: BLE001
            _fallo_redis(exc)
    ahora = time.monotonic()
    if ahora - _ultimo_barrido_local < segundos:
        return False
    _ultimo_barrido_local = ahora
    return True


def liberar_vencidos_si_toca():
    """Barrido global acotado y "de buena educación" para llamar al inicio de una
    petición de la tienda. Llamarlo ANTES de tomar otros locks: hace commit.

    - skip_locked: si otro proceso ya está cancelando un pedido, se lo salta en
      vez de quedarse esperando (el cliente que está comprando no espera a nadie).
    - Nunca rompe la petición que lo llamó: cualquier error se registra y se
      deshace, y el cron diario sigue siendo la red de seguridad.
    """
    if not _toca_barrer():
        return 0
    try:
        vencidos = (
            _query_vencidos()
            .order_by(Pedido.fecha_limite_pago)
            .limit(MAX_PEDIDOS_POR_BARRIDO_EN_CALIENTE)
            .with_for_update(of=Pedido, skip_locked=True)
            .all()
        )
        cancelados = _cancelar_y_avisar(vencidos)
    except Exception:  # noqa: BLE001
        db.session.rollback()
        log.exception("No se pudo liberar el stock de pedidos vencidos en caliente")
        return 0
    if cancelados:
        # Volvió stock: el catálogo cacheado ya no es correcto.
        invalidar_cache_publico()
    return cancelados


def con_barrido_de_vencidos(vista):
    """Decorador para vistas públicas del catálogo: barre ANTES de la caché, así
    un producto cuyo único stock estaba reservado por un pedido vencido deja de
    mostrarse como agotado (el barrido invalida la caché si devolvió stock)."""

    @wraps(vista)
    def envoltura(*args, **kwargs):
        liberar_vencidos_si_toca()
        return vista(*args, **kwargs)

    return envoltura
