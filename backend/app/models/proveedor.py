from datetime import datetime
from app.extensions import db


class Proveedor(db.Model):
    __tablename__ = "proveedores"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    contacto_nombre = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(120))
    direccion = db.Column(db.String(200))
    ruc = db.Column(db.String(20))
    notas = db.Column(db.Text)
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "contacto_nombre": self.contacto_nombre,
            "telefono": self.telefono,
            "email": self.email,
            "direccion": self.direccion,
            "ruc": self.ruc,
            "notas": self.notas,
            "activo": self.activo,
        }

    def __repr__(self):
        return f"<Proveedor {self.nombre}>"
