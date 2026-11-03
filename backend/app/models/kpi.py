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
    """
    Kardex: cada cambio de stock de una variante (o de un producto sin
    variantes) queda registrado aquí.

    Convención de `cantidad`:
    - venta y restauracion: siempre positiva, la dirección la da el tipo
      (venta resta stock, restauracion lo devuelve).
    - el resto de tipos: diferencia CON SIGNO (positiva si entra stock,
      negativa si sale). stock_antes/stock_despues dejan el resultado claro.
    """
    __tablename__ = "movimiento_stock"

    TIPOS = (
        "venta", "restauracion", "stock_inicial", "ingreso_compra",
        "ajuste_manual", "merma", "inventario_fisico",
    )
    ETIQUETAS = {
        "venta": "Venta",
        "restauracion": "Devolución por cancelación",
        "stock_inicial": "Stock inicial",
        "ingreso_compra": "Ingreso por compra",
        "ajuste_manual": "Ajuste manual",
        "merma": "Merma",
        "inventario_fisico": "Inventario físico",
    }

    id = db.Column(db.BigInteger, primary_key=True)
    variante_id = db.Column(db.Integer, db.ForeignKey("variantes_producto.id", ondelete="SET NULL"), nullable=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    tipo = db.Column(db.Enum(*TIPOS, name="movimiento_stock_tipo_enum"), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    # Fase 1 del módulo de almacén (migración 055)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    motivo = db.Column(db.String(255), nullable=True)
    stock_antes = db.Column(db.Integer, nullable=True)
    stock_despues = db.Column(db.Integer, nullable=True)
    costo_unitario = db.Column(db.Numeric(10, 2), nullable=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey("proveedores.id", ondelete="SET NULL"), nullable=True)

    producto = db.relationship("Producto")
    variante = db.relationship("VarianteProducto")
    usuario = db.relationship("Usuario")

    @property
    def delta(self):
        """Cambio real de stock con signo (+ entra, - sale)."""
        if self.tipo == "venta":
            return -abs(self.cantidad)
        if self.tipo == "restauracion":
            return abs(self.cantidad)
        return self.cantidad

    def to_dict(self):
        return {
            "id": self.id,
            "fecha": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "tipo": self.tipo,
            "tipo_label": self.ETIQUETAS.get(self.tipo, self.tipo),
            "cantidad": self.delta,
            "stock_antes": self.stock_antes,
            "stock_despues": self.stock_despues,
            "motivo": self.motivo,
            "costo_unitario": float(self.costo_unitario) if self.costo_unitario is not None else None,
            "pedido_id": self.pedido_id,
            "proveedor_id": self.proveedor_id,
            "producto_id": self.producto_id,
            "producto_nombre": self.producto.nombre if self.producto else None,
            "sku": self.producto.sku if self.producto else None,
            "variante_id": self.variante_id,
            "talla": self.variante.talla if self.variante else None,
            "color": self.variante.color if self.variante else None,
            "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre_completo if self.usuario else None,
        }

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
