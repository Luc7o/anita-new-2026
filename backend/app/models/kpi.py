"""
Modelos de soporte para KPIs de negocio. Ninguno de estos participa en la
lógica de negocio del checkout/pagos en sí — solo registran lo que ya pasó,
para poder calcular métricas después.
"""
from datetime import datetime
from app.extensions import db


class EventoAnalitica(db.Model):
    __tablename__ = "evento_analitica"

    TIPOS = (
        "vista_pagina", "vista_producto", "agregar_carrito",
        "inicio_checkout", "compra_completada",
    )

    id = db.Column(db.BigInteger, primary_key=True)
    tipo_evento = db.Column(db.Enum(*TIPOS, name="tipo_evento_enum"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    sesion_id = db.Column(db.String(64), nullable=False)
    metadata_json = db.Column("metadata", db.JSON, nullable=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<EventoAnalitica {self.tipo_evento} sesion={self.sesion_id}>"


class MovimientoStock(db.Model):
    __tablename__ = "movimiento_stock"

    TIPOS = ("venta", "restauracion")

    id = db.Column(db.BigInteger, primary_key=True)
    variante_id = db.Column(db.Integer, db.ForeignKey("variantes_producto.id", ondelete="SET NULL"), nullable=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    tipo = db.Column(db.Enum(*TIPOS, name="movimiento_stock_tipo_enum"), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<MovimientoStock {self.tipo} cantidad={self.cantidad}>"


class HistorialEstadoPedido(db.Model):
    __tablename__ = "historial_estado_pedido"

    id = db.Column(db.BigInteger, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    estado_anterior = db.Column(db.String(30), nullable=False)
    estado_nuevo = db.Column(db.String(30), nullable=False)
    cambiado_por = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<HistorialEstadoPedido pedido={self.pedido_id} {self.estado_anterior}->{self.estado_nuevo}>"


class IntentoPago(db.Model):
    __tablename__ = "intento_pago"

    ESTADOS = ("aprobado", "rechazado", "reembolsado")

    id = db.Column(db.BigInteger, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    estado = db.Column(db.Enum(*ESTADOS, name="intento_pago_estado_enum"), nullable=False)
    codigo_culqi = db.Column(db.String(40), nullable=True)
    motivo_rechazo = db.Column(db.String(255), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<IntentoPago pedido={self.pedido_id} {self.estado}>"


class PromocionUso(db.Model):
    """
    Sin uso todavía: el checkout actual no aplica cupones/códigos de
    descuento (Promocion es solo el banner del inicio). Se deja el modelo
    listo para cuando exista esa función.
    """
    __tablename__ = "promocion_uso"

    id = db.Column(db.BigInteger, primary_key=True)
    promocion_id = db.Column(db.Integer, db.ForeignKey("promociones.id", ondelete="CASCADE"), nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    monto_descuento = db.Column(db.Numeric(10, 2), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PromocionUso pedido={self.pedido_id}>"


class LatenciaRequest(db.Model):
    __tablename__ = "latencia_requests"

    id = db.Column(db.BigInteger, primary_key=True)
    endpoint = db.Column(db.String(150), nullable=False)
    metodo = db.Column(db.String(10), nullable=False)
    latencia_ms = db.Column(db.Integer, nullable=False)
    status_code = db.Column(db.SmallInteger, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LatenciaRequest {self.metodo} {self.endpoint} {self.status_code}>"
