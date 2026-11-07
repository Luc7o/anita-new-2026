from datetime import datetime
from app.extensions import db


class ItemCarrito(db.Model):
    """Una línea del carrito: un producto y, si el producto tiene variantes
    (talla/color), la VARIANTE exacta elegida.

    variante_id es NULL solo en productos sin variantes (su stock vive en
    productos.stock). La clave foránea es compuesta (variante_id, producto_id),
    así la base garantiza que la variante pertenece al mismo producto de la
    línea. Talla y color ya no se guardan aquí: se leen de la variante."""
    __tablename__ = "carrito"
    __table_args__ = (
        db.ForeignKeyConstraint(
            ["variante_id", "producto_id"],
            ["variantes_producto.id", "variantes_producto.producto_id"],
            ondelete="CASCADE", name="fk_carrito_variante",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    variante_id = db.Column(db.Integer, nullable=True)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    # KPIs: para medir abandono de carrito (cuánto tiempo pasa desde que se
    # agrega algo hasta que se compra o queda huérfano).
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Solo lectura: id y producto se asignan siempre con las columnas de arriba.
    variante = db.relationship("VarianteProducto", lazy="joined", viewonly=True)

    # --- Compatibilidad: el resto del código sigue leyendo item.talla /
    # item.color como texto (None si el producto no varía por ese eje).
    @property
    def talla(self):
        return self.variante.talla if self.variante else None

    @property
    def color(self):
        return self.variante.color if self.variante else None

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
        return f"<ItemCarrito usuario={self.usuario_id} producto={self.producto_id}>"
