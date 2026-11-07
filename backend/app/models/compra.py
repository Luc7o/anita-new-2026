from datetime import datetime
from app.extensions import db


class Compra(db.Model):
    """Compra de mercadería a un proveedor. Al registrarla, el stock ya subió."""
    __tablename__ = "compras"

    ESTADOS = ("recibida", "anulada")
    TIPOS_DOCUMENTO = ("factura", "boleta", "guia", "otro")

    id = db.Column(db.Integer, primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey("proveedores.id"), nullable=False)
    tipo_documento = db.Column(db.String(20))
    numero_documento = db.Column(db.String(40))
    fecha_compra = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum(*ESTADOS, name="compra_estado_enum"), nullable=False, default="recibida")
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    notas = db.Column(db.Text)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"))
    anulada_por = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"))
    fecha_anulacion = db.Column(db.DateTime)
    motivo_anulacion = db.Column(db.String(255))
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    proveedor = db.relationship("Proveedor")
    usuario = db.relationship("Usuario", foreign_keys=[usuario_id])
    anulador = db.relationship("Usuario", foreign_keys=[anulada_por])
    detalles = db.relationship(
        "DetalleCompra", backref="compra", cascade="all, delete-orphan",
        order_by="DetalleCompra.id",
    )

    @property
    def numero(self):
        return f"C-{self.id:06d}"

    def to_dict(self, con_detalles=False):
        data = {
            "id": self.id,
            "numero": self.numero,
            "proveedor_id": self.proveedor_id,
            "proveedor_nombre": self.proveedor.nombre if self.proveedor else None,
            "tipo_documento": self.tipo_documento,
            "numero_documento": self.numero_documento,
            "fecha_compra": self.fecha_compra.isoformat() if self.fecha_compra else None,
            "estado": self.estado,
            "total": float(self.total or 0),
            "notas": self.notas,
            "registrada_por": self.usuario.nombre_completo if self.usuario else None,
            "fecha_creacion": self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            "anulada_por": self.anulador.nombre_completo if self.anulador else None,
            "fecha_anulacion": self.fecha_anulacion.isoformat() if self.fecha_anulacion else None,
            "motivo_anulacion": self.motivo_anulacion,
        }
        if con_detalles:
            data["items"] = [d.to_dict() for d in self.detalles]
            data["unidades"] = sum(d.cantidad for d in self.detalles)
        return data

    def __repr__(self):
        return f"<Compra {self.id} proveedor={self.proveedor_id} {self.estado}>"


class DetalleCompra(db.Model):
    __tablename__ = "detalle_compra"

    id = db.Column(db.Integer, primary_key=True)
    compra_id = db.Column(db.Integer, db.ForeignKey("compras.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"), nullable=False)
    variante_id = db.Column(db.Integer, db.ForeignKey("variantes_producto.id", ondelete="SET NULL"))
    talla = db.Column(db.String(20))
    color = db.Column(db.String(50))
    cantidad = db.Column(db.Integer, nullable=False)
    costo_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    producto = db.relationship("Producto")

    def to_dict(self):
        return {
            "id": self.id,
            "producto_id": self.producto_id,
            "producto_nombre": self.producto.nombre if self.producto else None,
            "sku": self.producto.sku if self.producto else None,
            "variante_id": self.variante_id,
            "talla": self.talla,
            "color": self.color,
            "cantidad": self.cantidad,
            "costo_unitario": float(self.costo_unitario),
            "subtotal": float(self.subtotal),
        }
