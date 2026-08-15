from datetime import datetime
from app.extensions import db


class ConfiguracionPago(db.Model):
    __tablename__ = "configuracion_pagos"

    id = db.Column(db.Integer, primary_key=True)
    yape_numero = db.Column(db.String(20))
    yape_titular = db.Column(db.String(120))
    yape_qr_url = db.Column(db.String(400))
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def obtener():
        """Siempre hay una sola fila (id=1); la crea si todavía no existe."""
        config = ConfiguracionPago.query.get(1)
        if not config:
            config = ConfiguracionPago(id=1)
            db.session.add(config)
            db.session.commit()
        return config

    def to_dict(self):
        return {
            "yape_numero": self.yape_numero,
            "yape_titular": self.yape_titular,
            "yape_qr_url": self.yape_qr_url,
        }
