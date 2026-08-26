from app.extensions import db


class ItemCarrito(db.Model):
    __tablename__ = "carrito"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False, default=1)
    # Referencian el catálogo (tallas/colores) en vez de texto libre. Acá sí
    # puede ser NULL de verdad (no hay UNIQUE que dependa de esto, a
    # diferencia de variantes_producto).
    talla_id = db.Column(db.Integer, db.ForeignKey("tallas.id"), nullable=True)
    color_id = db.Column(db.Integer, db.ForeignKey("colores.id"), nullable=True)

    talla_obj = db.relationship("Talla", lazy="joined")
    color_obj = db.relationship("Color", lazy="joined")

    # --- Compatibilidad: carrito.py sigue leyendo/escribiendo item.talla /
    # item.color como texto. A diferencia del catálogo del admin, acá el
    # nombre debe corresponder a una talla/color que YA existe (viene de un
    # cliente eligiendo una variante real) — por eso el setter solo busca,
    # nunca crea.
    @property
    def talla(self):
        return self.talla_obj.nombre if self.talla_obj else None

    @talla.setter
    def talla(self, nombre):
        if not nombre:
            self.talla_obj = None
            return
        from app.models.catalogo import Talla
        talla = Talla.por_nombre(nombre)
        if not talla:
            raise ValueError(f"Talla no reconocida: {nombre}")
        self.talla_obj = talla

    @property
    def color(self):
        return self.color_obj.nombre if self.color_obj else None

    @color.setter
    def color(self, nombre):
        if not nombre:
            self.color_obj = None
            return
        from app.models.catalogo import Color
        color = Color.por_nombre(nombre)
        if not color:
            raise ValueError(f"Color no reconocido: {nombre}")
        self.color_obj = color

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
