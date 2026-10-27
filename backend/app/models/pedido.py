from datetime import datetime
import secrets
import uuid
from app.extensions import db


# OJO: los valores válidos de estado, estado de pago, método de pago, entrega y
# origen también están escritos como restricciones CHECK en la base de datos
# (migración 046). Si agregas uno nuevo en los diccionarios de abajo, agrégalo
# también en esa restricción con una migración nueva; si no, la base lo rechazará.
class Pedido(db.Model):
    __tablename__ = "pedidos"

    ESTADOS = {
        "pendiente": "Pendiente",
        "confirmado": "Confirmado",
        "preparando": "Preparando",
        "listo_recojo": "Listo para recoger",
        "enviado": "Enviado",
        "entregado": "Entregado",
        "cancelado": "Cancelado",
    }

    # Máquina de estados: desde qué estado se puede pasar a cuáles otros.
    # "entregado" y "cancelado" son finales — no admiten ningún cambio más.
    # La cancelación solo está permitida antes de "enviado" (o, en un recojo,
    # mientras el pedido espera en la tienda como "listo_recojo").
    #
    # Desde "preparando" el pedido sigue UNO de dos caminos, según cómo se
    # entrega (puede_pasar_a se encarga de filtrarlo):
    #   - delivery:       preparando -> enviado -> entregado
    #   - recojo online:  preparando -> listo_recojo -> entregado (con código)
    TRANSICIONES_VALIDAS = {
        "pendiente": {"confirmado", "cancelado"},
        "confirmado": {"preparando", "cancelado"},
        "preparando": {"enviado", "listo_recojo", "cancelado"},
        "listo_recojo": {"entregado", "cancelado"},
        "enviado": {"entregado"},
        "entregado": set(),
        "cancelado": set(),
    }
    METODOS_PAGO = {
        "yape": "Yape",
        "tarjeta": "Tarjeta de crédito/débito",
        "efectivo": "Pago contra entrega",  # ya no se ofrece en checkout, solo queda para pedidos antiguos
    }
    # Métodos que se pueden elegir en una compra NUEVA (el pago contra entrega se retiró)
    METODOS_PAGO_DISPONIBLES = {"yape", "tarjeta"}
    TIPOS_ENTREGA = {
        "delivery": "Delivery a domicilio",
        "recojo": "Recojo en tienda",
    }

    ESTADOS_PAGO = {
        "pendiente": "Pendiente",
        "en_revision": "En revisión",
        "verificado": "Pago verificado",
        "rechazado": "Pago rechazado",
        "no_aplica": "No aplica",
        "reembolso_pendiente": "Reembolso pendiente",
        "reembolsado": "Reembolsado",
    }
    # De dónde vino el pedido: compra normal del checkout público, o venta
    # registrada por un admin en el mostrador de la tienda física.
    ORIGENES = {
        "online": "Compra en línea",
        "presencial": "Venta en tienda",
    }

    id = db.Column(db.Integer, primary_key=True)
    numero_pedido = db.Column(db.String(30), unique=True, nullable=False)
    idempotency_key = db.Column(db.String(64), unique=True)
    # Nullable: una venta presencial (mostrador) puede no tener una cuenta de
    # cliente asociada — en ese caso el nombre/teléfono del cliente se guardan
    # igual en envio_nombre/envio_telefono, solo que sin cuenta detrás.
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="RESTRICT"), nullable=True)

    estado = db.Column(db.String(20), default="pendiente")
    estado_pago = db.Column(db.String(20), default="pendiente")
    metodo_pago = db.Column(db.String(20), nullable=False)
    tipo_entrega = db.Column(db.String(20), default="delivery")
    origen = db.Column(db.String(20), nullable=False, default="online")

    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    costo_envio = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), nullable=False)

    envio_nombre = db.Column(db.String(160))
    envio_tipo_documento = db.Column(db.String(10))
    envio_numero_documento = db.Column(db.String(15))
    envio_telefono = db.Column(db.String(20))
    envio_email = db.Column(db.String(120))
    envio_direccion = db.Column(db.String(200))
    envio_distrito = db.Column(db.String(100))
    envio_provincia = db.Column(db.String(100))
    envio_dpto = db.Column(db.String(100))
    envio_referencia = db.Column(db.String(200))

    # Código de 6 dígitos para retirar el pedido en tienda. Se genera cuando el
    # pedido pasa a "listo_recojo" y solo lo ve el cliente (nunca el admin).
    codigo_recojo = db.Column(db.String(6), nullable=True)

    # Solo referencia visual — NUNCA se guarda número completo ni CVV

    # Identificador del cargo en Culqi ("chr_..."), cuando el pago se hizo
    # por la pasarela — sirve para conciliar y consultar el cargo después.
    culqi_cargo_id = db.Column(db.String(40))

    # Clave de idempotencia del INTENTO DE PAGO (distinta de idempotency_key,
    # que es de la creación del pedido). Ver migraciones/023_*.sql para el
    # detalle de por qué hace falta una columna separada.
    pago_idempotency_key = db.Column(db.String(64))

    nota = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    # --- KPIs ---
    # Cuándo se confirmó el pago de verdad (no cuándo se creó el pedido).
    fecha_pago = db.Column(db.DateTime, nullable=True)
    # Cuándo el admin marcó el pedido como entregado.
    fecha_entregado = db.Column(db.DateTime, nullable=True)
    # Motivo fijo de por qué se canceló: 'vencimiento_pago', 'cliente',
    # 'sin_stock', 'pago_rechazado'. NULL si nunca se canceló.
    motivo_cancelacion = db.Column(db.String(50), nullable=True)
    # Distrito normalizado del envío (además de envio_distrito, que sigue
    # siendo texto libre para no romper pedidos ya guardados así).
    distrito_id = db.Column(db.Integer, db.ForeignKey("ubigeo_distritos.id"), nullable=True)
    # Solo se setea para pedidos que se pagan por pasarela (tarjeta/Yape):
    # mientras estado_pago siga "pendiente" pasada esta fecha, el pedido se
    # considera vencido y su stock puede liberarse (ver
    # app/utils/pedidos_vencidos.py). None para pedidos que no aplican
    # (efectivo, ya pagados, etc.).
    fecha_limite_pago = db.Column(db.DateTime)

    detalles = db.relationship(
        "DetallePedido", backref="pedido", lazy="dynamic",
        cascade="all, delete-orphan", passive_deletes=True,
    )

    @staticmethod
    def generar_numero():
        return f"ANS-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

    @property
    def es_recojo_online(self):
        """Compra por la web que el cliente retira en la tienda. Es el único
        caso que usa el código de recojo: una venta presencial (mostrador) ya
        se entrega en el momento, así que no lo necesita."""
        return self.tipo_entrega == "recojo" and self.origen == "online"

    def puede_pasar_a(self, nuevo_estado):
        # "enviado" solo tiene sentido en un delivery y "listo_recojo" solo
        # en un recojo online: cada pedido ve únicamente su propio camino.
        if nuevo_estado == "listo_recojo" and not self.es_recojo_online:
            return False
        if (
            nuevo_estado == "enviado"
            and self.estado == "preparando"
            and self.es_recojo_online
        ):
            return False
        return nuevo_estado in self.TRANSICIONES_VALIDAS.get(self.estado, set())

    @staticmethod
    def generar_codigo_recojo():
        """Código de 6 dígitos al azar (con `secrets`, apto para seguridad;
        `random` es predecible). Se rellena con ceros: '004821'."""
        return f"{secrets.randbelow(1_000_000):06d}"

    def codigo_recojo_coincide(self, codigo):
        """Compara el código escrito con el del pedido en tiempo constante
        (evita que se pueda adivinar midiendo cuánto tarda la comparación)."""
        if not self.codigo_recojo or not codigo:
            return False
        return secrets.compare_digest(self.codigo_recojo, str(codigo).strip())

    @property
    def esta_vencido(self):
        """True si este pedido reservó stock por pasarela y se pasó el
        plazo de pago sin que el cliente completara el cobro."""
        return (
            self.estado_pago == "pendiente"
            and self.fecha_limite_pago is not None
            and datetime.utcnow() >= self.fecha_limite_pago
        )

    @property
    def estado_label(self):
        return self.ESTADOS.get(self.estado, self.estado)

    @property
    def estado_pago_label(self):
        return self.ESTADOS_PAGO.get(self.estado_pago, self.estado_pago)

    @property
    def metodo_pago_label(self):
        return self.METODOS_PAGO.get(self.metodo_pago, self.metodo_pago)

    @property
    def origen_label(self):
        return self.ORIGENES.get(self.origen, self.origen)

    @property
    def entrega_estimada_label(self):
        """
        Texto de tiempo estimado de entrega para mostrar en la confirmación
        del pedido. El delivery es solo dentro de Huancayo (ver
        app/utils/zona_entrega.py) y hoy se usa una sola regla fija.
        """
        if self.tipo_entrega == "recojo":
            return None
        return "3 a 5 días hábiles"

    def to_dict(self, con_detalles=True, incluir_codigo=False):
        data = {
            "id": self.id,
            "numero_pedido": self.numero_pedido,
            "estado": self.estado,
            "estado_label": self.estado_label,
            "estado_pago": self.estado_pago,
            "estado_pago_label": self.estado_pago_label,
            "metodo_pago": self.metodo_pago,
            "metodo_pago_label": self.metodo_pago_label,
            "tipo_entrega": self.tipo_entrega,
            "entrega_estimada_label": self.entrega_estimada_label,
            "origen": self.origen,
            "origen_label": self.origen_label,
            "subtotal": float(self.subtotal),
            "costo_envio": float(self.costo_envio),
            "total": float(self.total),
            "envio_nombre": self.envio_nombre,
            "envio_tipo_documento": self.envio_tipo_documento,
            "envio_numero_documento": self.envio_numero_documento,
            "envio_telefono": self.envio_telefono,
            "envio_email": self.envio_email,
            "envio_direccion": self.envio_direccion,
            "envio_distrito": self.envio_distrito,
            "envio_provincia": self.envio_provincia,
            "envio_dpto": self.envio_dpto,
            "envio_referencia": self.envio_referencia,
            "nota": self.nota,
            "culqi_cargo_id": self.culqi_cargo_id,
            "fecha_creacion": self.fecha_creacion.isoformat(),
            "fecha_limite_pago": self.fecha_limite_pago.isoformat() if self.fecha_limite_pago else None,
            "fecha_pago": self.fecha_pago.isoformat() if self.fecha_pago else None,
            "fecha_entregado": self.fecha_entregado.isoformat() if self.fecha_entregado else None,
            "motivo_cancelacion": self.motivo_cancelacion,
            "distrito_id": self.distrito_id,
            "requiere_codigo_recojo": self.es_recojo_online,
        }
        # El código solo viaja hacia el CLIENTE (incluir_codigo=True) y solo
        # mientras espera en tienda. El admin nunca lo recibe: tiene que
        # pedírselo al cliente, que es justo lo que prueba que está ahí.
        if incluir_codigo and self.estado == "listo_recojo":
            data["codigo_recojo"] = self.codigo_recojo
        if con_detalles:
            data["detalles"] = [d.to_dict() for d in self.detalles]
        return data

    def __repr__(self):
        return f"<Pedido {self.numero_pedido}>"


class DetallePedido(db.Model):
    __tablename__ = "detalles_pedido"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"), nullable=False)
    # Referencia histórica directa a la variante comprada (si el producto usa
    # variantes). Se guarda además de talla/color porque la variante podría
    # editarse o eliminarse después: con este id, restaurar_stock_de_pedido()
    # no depende de volver a encontrarla por producto+talla+color.
    # ondelete="SET NULL": si la variante se borra, el detalle del pedido
    # (histórico) se conserva igual, solo se pierde el enlace directo.
    variante_id = db.Column(db.Integer, db.ForeignKey("variantes_producto.id", ondelete="SET NULL"))
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    precio_unit = db.Column(db.Numeric(10, 2), nullable=False)
    talla = db.Column(db.String(20))
    color = db.Column(db.String(50))
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "producto_id": self.producto_id,
            "variante_id": self.variante_id,
            "producto_nombre": self.producto.nombre if self.producto else None,
            "cantidad": self.cantidad,
            "precio_unit": float(self.precio_unit),
            "talla": self.talla,
            "color": self.color,
            "subtotal": float(self.subtotal),
        }

    def __repr__(self):
        return f"<DetallePedido pedido={self.pedido_id} producto={self.producto_id}>"
