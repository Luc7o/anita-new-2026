from app.extensions import db


class VarianteProducto(db.Model):
    """
    Stock específico de una combinación de talla/color de un producto.
    Si un producto no tiene tallas ni colores, no usa variantes: su stock
    vive directamente en Producto.stock (comportamiento simple, sin cambios).

    talla_id/color_id referencian el catálogo (tallas/colores) en vez de
    repetir el texto en cada fila — antes "Rojo" se escribía una vez por
    cada variante de cada producto que lo usara, sin ninguna garantía de
    que estuviera escrito siempre igual.
    """
    __tablename__ = "variantes_producto"
    __table_args__ = (
        db.UniqueConstraint("producto_id", "talla_id", "color_id", name="uq_variante_producto"),
    )

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    # Igual que antes con '' de texto: apuntan al registro placeholder
    # (Talla/Color con nombre='') cuando el producto no varía por ese eje,
    # nunca NULL — así el UNIQUE de arriba sigue protegiendo duplicados.
    talla_id = db.Column(db.Integer, db.ForeignKey("tallas.id"), nullable=False)
    color_id = db.Column(db.Integer, db.ForeignKey("colores.id"), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)

    talla_obj = db.relationship("Talla", lazy="joined")
    color_obj = db.relationship("Color", lazy="joined")

    # --- Compatibilidad: el resto del código (Producto.variante_para,
    # admin_productos.py, stock.py) sigue leyendo/escribiendo
    # variante.talla / variante.color como texto, igual que antes.
    @property
    def talla(self):
        return self.talla_obj.nombre if self.talla_obj and self.talla_obj.nombre else None

    @talla.setter
    def talla(self, nombre):
        from app.models.catalogo import Talla
        self.talla_obj = Talla.obtener_o_crear(nombre or "")

    @property
    def color(self):
        return self.color_obj.nombre if self.color_obj and self.color_obj.nombre else None

    @color.setter
    def color(self, nombre):
        from app.models.catalogo import Color
        self.color_obj = Color.obtener_o_crear(nombre or "")

    def to_dict(self):
        return {
            "id": self.id,
            "talla": self.talla,
            "color": self.color,
            "stock": self.stock,
        }

    def __repr__(self):
        return f"<VarianteProducto producto={self.producto_id} talla={self.talla} color={self.color}>"
