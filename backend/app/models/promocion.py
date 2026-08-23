from datetime import datetime, date
from app.extensions import db


class Promocion(db.Model):
    """
    Banner de temporada para el carrusel del inicio (Día de la Madre, Día
    del Niño, Navidad, etc). `activo` es un apagador manual; fecha_inicio/
    fecha_fin acotan además una ventana de vigencia opcional — si están
    vacías, la promoción se considera vigente mientras esté activa.
    """
    __tablename__ = "promociones"

    id = db.Column(db.Integer, primary_key=True)
    etiqueta = db.Column(db.String(60), default="")  # ej. "TEMPORADA 2026", "DÍA DE LA MADRE"
    titulo = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.String(400), default="")
    imagen_url = db.Column(db.String(400), default="")
    boton_texto = db.Column(db.String(60), default="Ver Todo")
    boton_link = db.Column(db.String(200), default="/tienda")

    fecha_inicio = db.Column(db.Date, nullable=True)
    fecha_fin = db.Column(db.Date, nullable=True)

    activo = db.Column(db.Boolean, default=True)
    orden = db.Column(db.Integer, default=0)

    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def vigente(self):
        if not self.activo:
            return False
        hoy = date.today()
        if self.fecha_inicio and hoy < self.fecha_inicio:
            return False
        if self.fecha_fin and hoy > self.fecha_fin:
            return False
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "etiqueta": self.etiqueta,
            "titulo": self.titulo,
            "descripcion": self.descripcion,
            "imagen_url": self.imagen_url,
            "boton_texto": self.boton_texto,
            "boton_link": self.boton_link,
            "fecha_inicio": self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            "fecha_fin": self.fecha_fin.isoformat() if self.fecha_fin else None,
            "activo": self.activo,
            "vigente": self.vigente,
            "orden": self.orden,
        }

    def __repr__(self):
        return f"<Promocion {self.titulo}>"
