from datetime import datetime
from app.extensions import db


class ImagenProducto(db.Model):
    __tablename__ = "imagenes_producto"

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    url = db.Column(db.String(400), nullable=False)
    # Si color es NULL, es una imagen general del producto (no ligada a un color específico)
    color = db.Column(db.String(50))
    orden = db.Column(db.Integer, default=0)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "color": self.color,
            "orden": self.orden,
        }

    def __repr__(self):
        return f"<ImagenProducto producto={self.producto_id} color={self.color}>"
