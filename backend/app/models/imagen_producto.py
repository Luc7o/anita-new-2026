from datetime import datetime
from app.extensions import db


class ImagenProducto(db.Model):
    __tablename__ = "imagenes_producto"

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    url = db.Column(db.String(400), nullable=False)
    # Si color_id es NULL, es una imagen general del producto (no ligada a
    # un color específico). Referencia al catálogo (colores) en vez de
    # texto libre, igual que en variantes_producto.
    color_id = db.Column(db.Integer, db.ForeignKey("colores.id"), nullable=True)
    orden = db.Column(db.Integer, default=0)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    color_obj = db.relationship("Color", lazy="joined")

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
            "url": self.url,
            "color": self.color,
            "orden": self.orden,
        }

    def __repr__(self):
        return f"<ImagenProducto producto={self.producto_id} color={self.color}>"
