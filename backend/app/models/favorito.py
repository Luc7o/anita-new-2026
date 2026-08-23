from datetime import datetime
from app.extensions import db


class Favorito(db.Model):
    __tablename__ = "favoritos"
    __table_args__ = (
        db.UniqueConstraint("usuario_id", "producto_id", name="uq_favorito_usuario_producto"),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    producto = db.relationship("Producto")

    def __repr__(self):
        return f"<Favorito usuario={self.usuario_id} producto={self.producto_id}>"
