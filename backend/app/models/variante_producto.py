from app.extensions import db


class VarianteProducto(db.Model):
    """
    Una variante de un producto: una combinación de talla y/o color con su stock.
    TODO producto tiene al menos una. Un producto simple (sin tallas ni colores)
    tiene una única variante con talla y color en NULL; el stock del producto es la
    suma de sus variantes. La base hace cumplir esa regla (migración 003).

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
    # NULL = el producto no varía por ese eje. El UNIQUE de la base cuenta dos NULL como
    # iguales (NULLS NOT DISTINCT), así que no hay variantes repetidas.
    talla_id = db.Column(db.Integer, db.ForeignKey("tallas.id"), nullable=True)
    color_id = db.Column(db.Integer, db.ForeignKey("colores.id"), nullable=True)
    stock = db.Column(db.Integer, nullable=False, default=0)

    talla_obj = db.relationship("Talla", lazy="joined")
    color_obj = db.relationship("Color", lazy="joined")

    # --- Compatibilidad: el resto del código (Producto.variante_para,
    # admin_productos.py, stock.py) sigue leyendo/escribiendo
    # variante.talla / variante.color como texto, igual que antes.
    @property
    def talla(self):
        return self.talla_obj.nombre if self.talla_obj else None

    @talla.setter
    def talla(self, nombre):
        from app.models.catalogo import Talla
        self.talla_obj = Talla.obtener_o_crear(nombre) if nombre else None

    @property
    def color(self):
        return self.color_obj.nombre if self.color_obj else None

    @color.setter
    def color(self, nombre):
        from app.models.catalogo import Color
        self.color_obj = Color.obtener_o_crear(nombre) if nombre else None

    def to_dict(self):
        return {
            "id": self.id,
            "talla": self.talla,
            "color": self.color,
            "stock": self.stock,
        }

    def __repr__(self):
        return f"<VarianteProducto producto={self.producto_id} talla={self.talla} color={self.color}>"
