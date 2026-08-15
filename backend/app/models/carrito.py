from app.extensions import db


class ItemCarrito(db.Model):
    __tablename__ = "carrito"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    talla = db.Column(db.String(20))
    color = db.Column(db.String(50))

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
