from datetime import datetime
from app.extensions import db


class ItemCarrito(db.Model):
    """Una línea del carrito: la VARIANTE exacta que el cliente eligió y cuántas quiere.

    Todo producto tiene al menos una variante (un producto simple tiene una sin talla
    ni color), así que el carrito solo guarda variante_id. El producto, la talla y el
    color se leen de la variante: no se repiten aquí. Una sola línea por usuario y
    variante (la base lo exige). Si la variante se elimina, la línea desaparece."""
    __tablename__ = "carrito"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    variante_id = db.Column(
        db.Integer, db.ForeignKey("variantes_producto.id", ondelete="CASCADE", name="fk_carrito_variante"),
        nullable=False,
    )
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    # KPIs: para medir abandono de carrito (cuánto tiempo pasa desde que se
    # agrega algo hasta que se compra o queda huérfano).
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    variante = db.relationship("VarianteProducto", lazy="joined")

    @property
    def producto(self):
        return self.variante.producto

    @property
    def producto_id(self):
        return self.variante.producto_id

    # El resto del código lee item.talla / item.color como texto (None si el producto
    # no varía por ese eje).
    @property
    def talla(self):
        return self.variante.talla

    @property
    def color(self):
        return self.variante.color

    @property
    def subtotal(self):
        return round(self.producto.precio_final * self.cantidad, 2)

    def to_dict(self):
        return {
            "id": self.id,
            "producto": self.producto.to_dict(resumen=True),
            "cantidad": self.cantidad,
            "talla": self.talla,
            "color": self.color,
            "subtotal": self.subtotal,
        }

    def __repr__(self):
        return f"<ItemCarrito usuario={self.usuario_id} variante={self.variante_id}>"
