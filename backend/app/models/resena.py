from datetime import datetime
from app.extensions import db


class Resena(db.Model):
    __tablename__ = "resenas"
    __table_args__ = (
        db.UniqueConstraint("producto_id", "usuario_id", name="uq_resena_producto_usuario"),
    )

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    calificacion = db.Column(db.Integer, nullable=False)  # 1 a 5
    comentario = db.Column(db.Text)
    compra_verificada = db.Column(db.Boolean, default=False)

    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario = db.relationship("Usuario")

    def to_dict(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "usuario_nombre": self.usuario.nombre if self.usuario else "Cliente",
            "calificacion": self.calificacion,
            "comentario": self.comentario,
            "compra_verificada": self.compra_verificada,
            "fecha_creacion": self.fecha_creacion.isoformat(),
        }

    def __repr__(self):
        return f"<Resena producto={self.producto_id} usuario={self.usuario_id} calif={self.calificacion}>"
