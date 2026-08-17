from datetime import datetime
import uuid
from app.extensions import db


class Pedido(db.Model):
    __tablename__ = "pedidos"

    ESTADOS = {
        "pendiente": "Pendiente",
        "confirmado": "Confirmado",
        "preparando": "Preparando",
        "enviado": "Enviado",
        "entregado": "Entregado",
        "cancelado": "Cancelado",
    }

    # Máquina de estados: desde qué estado se puede pasar a cuáles otros.
    # "entregado" y "cancelado" son finales — no admiten ningún cambio más.
    # La cancelación solo está permitida antes de "enviado".
    TRANSICIONES_VALIDAS = {
        "pendiente": {"confirmado", "cancelado"},
        "confirmado": {"preparando", "cancelado"},
        "preparando": {"enviado", "cancelado"},
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

    id = db.Column(db.Integer, primary_key=True)
    numero_pedido = db.Column(db.String(30), unique=True, nullable=False)
    idempotency_key = db.Column(db.String(64), unique=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    estado = db.Column(db.String(20), default="pendiente")
    estado_pago = db.Column(db.String(20), default="pendiente")
    comprobante_url = db.Column(db.String(400))
    metodo_pago = db.Column(db.String(20), nullable=False)
    tipo_entrega = db.Column(db.String(20), default="delivery")

    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    costo_envio = db.Column(db.Numeric(10, 2), default=0)
    total = db.Column(db.Numeric(10, 2), nullable=False)

    envio_nombre = db.Column(db.String(160))
    envio_telefono = db.Column(db.String(20))
    envio_direccion = db.Column(db.String(200))
    envio_distrito = db.Column(db.String(100))
    envio_provincia = db.Column(db.String(100))
    envio_dpto = db.Column(db.String(100))
    envio_referencia = db.Column(db.String(200))

    # Seguimiento del envío (lo completa el admin cuando despacha el pedido)
    empresa_envio = db.Column(db.String(100))
    numero_seguimiento = db.Column(db.String(100))

    # Solo referencia visual — NUNCA se guarda número completo ni CVV
    tarjeta_titular = db.Column(db.String(160))
    tarjeta_ultimos4 = db.Column(db.String(4))

    # Identificador del cargo en Culqi ("chr_..."), cuando el pago se hizo
    # por la pasarela — sirve para conciliar y consultar el cargo después.
    culqi_cargo_id = db.Column(db.String(40))

    nota = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    detalles = db.relationship(
        "DetallePedido", backref="pedido", lazy="dynamic",
        cascade="all, delete-orphan", passive_deletes=True,
    )

    @staticmethod
    def generar_numero():
        return f"ANS-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"

    def puede_pasar_a(self, nuevo_estado):
        return nuevo_estado in self.TRANSICIONES_VALIDAS.get(self.estado, set())

    @property
    def estado_label(self):
        return self.ESTADOS.get(self.estado, self.estado)

    @property
    def estado_pago_label(self):
        return self.ESTADOS_PAGO.get(self.estado_pago, self.estado_pago)

    @property
    def metodo_pago_label(self):
        return self.METODOS_PAGO.get(self.metodo_pago, self.metodo_pago)

    def to_dict(self, con_detalles=True):
        data = {
            "id": self.id,
            "numero_pedido": self.numero_pedido,
            "estado": self.estado,
            "estado_label": self.estado_label,
            "estado_pago": self.estado_pago,
            "estado_pago_label": self.estado_pago_label,
            "comprobante_url": self.comprobante_url,
            "metodo_pago": self.metodo_pago,
            "metodo_pago_label": self.metodo_pago_label,
            "tipo_entrega": self.tipo_entrega,
            "subtotal": float(self.subtotal),
            "costo_envio": float(self.costo_envio),
            "total": float(self.total),
            "envio_nombre": self.envio_nombre,
            "envio_telefono": self.envio_telefono,
            "envio_direccion": self.envio_direccion,
            "envio_distrito": self.envio_distrito,
            "envio_provincia": self.envio_provincia,
            "envio_dpto": self.envio_dpto,
            "envio_referencia": self.envio_referencia,
            "nota": self.nota,
            "tarjeta_titular": self.tarjeta_titular,
            "tarjeta_ultimos4": self.tarjeta_ultimos4,
            "culqi_cargo_id": self.culqi_cargo_id,
            "empresa_envio": self.empresa_envio,
            "numero_seguimiento": self.numero_seguimiento,
            "fecha_creacion": self.fecha_creacion.isoformat(),
        }
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
