from app.extensions import db


class VarianteProducto(db.Model):
    """
    Stock específico de una combinación de talla/color de un producto.
    Si un producto no tiene tallas ni colores, no usa variantes: su stock
    vive directamente en Producto.stock (comportamiento simple, sin cambios).
    """
    __tablename__ = "variantes_producto"
    __table_args__ = (
        db.UniqueConstraint("producto_id", "talla", "color", name="uq_variante_producto"),
    )

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    # '' (cadena vacía) significa "el producto no distingue por ese eje".
    # Usamos '' en vez de NULL a propósito: en MySQL, NULL nunca es igual a
    # otro NULL dentro de un UNIQUE, así que con NULL el UNIQUE de abajo NO
    # evitaría duplicados cuando un producto solo varía por talla o por
    # color. Con '' como valor real, el UNIQUE sí protege siempre.
    talla = db.Column(db.String(20), nullable=False, default="")
    color = db.Column(db.String(50), nullable=False, default="")
    stock = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "talla": self.talla or None,
            "color": self.color or None,
            "stock": self.stock,
        }

    def __repr__(self):
        return f"<VarianteProducto producto={self.producto_id} talla={self.talla} color={self.color}>"
