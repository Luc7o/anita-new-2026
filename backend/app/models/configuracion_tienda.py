from datetime import datetime
from app.extensions import db


class ConfiguracionTienda(db.Model):
    """
    Datos generales de la tienda (nombre, contacto, dirección física, redes
    sociales, moneda). Un único registro (id=1) — mismo patrón que la antigua
    configuracion_pagos (ver migración 005, eliminada en la 017).

    Antes estos datos vivían fijos en frontend/src/datosEmpresa.js: cambiar
    un teléfono exigía tocar código y volver a desplegar. Ahora el panel
    admin los edita en vivo (ver app/routes/admin_configuracion.py) y el
    endpoint público /api/configuracion/tienda se los sirve al frontend de
    la tienda para que deje de depender del archivo estático.
    """
    __tablename__ = "configuracion_tienda"

    id = db.Column(db.Integer, primary_key=True)

    nombre_comercial = db.Column(db.String(120), nullable=False, default="Anita New Style")
    logo_url = db.Column(db.String(400))

    correo_contacto = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    whatsapp = db.Column(db.String(20))

    direccion = db.Column(db.String(200))
    referencia = db.Column(db.String(200))
    ciudad = db.Column(db.String(80))
    horario_atencion = db.Column(db.String(120))
    maps_url = db.Column(db.String(400))

    facebook_url = db.Column(db.String(200))
    instagram_url = db.Column(db.String(200))
    tiktok_url = db.Column(db.String(200))

    moneda = db.Column(db.String(3), nullable=False, default="PEN")

    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def obtener():
        """Devuelve el registro único (id=1), creándolo si todavía no existe
        (por ejemplo, en una BD migrada antes de que esta tabla existiera)."""
        config = ConfiguracionTienda.query.get(1)
        if not config:
            config = ConfiguracionTienda(id=1)
            db.session.add(config)
            db.session.commit()
        return config

    def to_dict(self):
        return {
            "nombre_comercial": self.nombre_comercial,
            "logo_url": self.logo_url or "",
            "correo_contacto": self.correo_contacto or "",
            "telefono": self.telefono or "",
            "whatsapp": self.whatsapp or "",
            "direccion": self.direccion or "",
            "referencia": self.referencia or "",
            "ciudad": self.ciudad or "",
            "horario_atencion": self.horario_atencion or "",
            "maps_url": self.maps_url or "",
            "facebook_url": self.facebook_url or "",
            "instagram_url": self.instagram_url or "",
            "tiktok_url": self.tiktok_url or "",
            "moneda": self.moneda,
            "actualizado_en": self.actualizado_en.isoformat() if self.actualizado_en else None,
        }

    def __repr__(self):
        return f"<ConfiguracionTienda {self.nombre_comercial}>"
