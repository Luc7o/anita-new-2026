from datetime import datetime, timedelta
from app.extensions import db

TIPOS_BIEN = ("producto", "servicio")
TIPOS_RECLAMACION = ("reclamo", "queja")
ESTADOS = ("pendiente", "respondido")
DIAS_HABILES_RESPUESTA = 15


def sumar_dias_habiles(desde, dias):
    """
    Suma `dias` días hábiles (lunes a viernes) a una fecha. No descuenta
    feriados: el plazo calculado puede salir un poco más corto que el legal,
    lo cual es el lado seguro para el proveedor (nunca vence antes de tiempo
    sin que se note).
    """
    fecha = desde
    restantes = dias
    while restantes > 0:
        fecha += timedelta(days=1)
        if fecha.weekday() < 5:
            restantes -= 1
    return fecha


class Reclamacion(db.Model):
    """Hoja de reclamación virtual (Libro de Reclamaciones, Indecopi)."""
    __tablename__ = "reclamaciones"

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True)
    fecha_registro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    fecha_limite = db.Column(db.Date, nullable=False)

    consumidor_nombre = db.Column(db.String(150), nullable=False)
    consumidor_doc_tipo = db.Column(db.String(5), nullable=False)
    consumidor_documento = db.Column(db.String(20), nullable=False)
    consumidor_domicilio = db.Column(db.String(250), nullable=False)
    consumidor_telefono = db.Column(db.String(30), nullable=False)
    consumidor_email = db.Column(db.String(150), nullable=False)
    apoderado_nombre = db.Column(db.String(150))

    bien_tipo = db.Column(db.String(10), nullable=False)
    bien_descripcion = db.Column(db.String(400), nullable=False)
    monto_reclamado = db.Column(db.Numeric(10, 2))
    numero_pedido = db.Column(db.String(40))

    tipo = db.Column(db.String(10), nullable=False)
    detalle = db.Column(db.Text, nullable=False)
    pedido_consumidor = db.Column(db.Text, nullable=False)

    estado = db.Column(db.String(15), nullable=False, default="pendiente")
    respuesta = db.Column(db.Text)
    fecha_respuesta = db.Column(db.DateTime)
    respondido_por = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="SET NULL"))

    def to_dict(self):
        return {
            "id": self.id,
            "codigo": self.codigo,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
            "fecha_limite": self.fecha_limite.isoformat() if self.fecha_limite else None,
            "consumidor_nombre": self.consumidor_nombre,
            "consumidor_doc_tipo": self.consumidor_doc_tipo,
            "consumidor_documento": self.consumidor_documento,
            "consumidor_domicilio": self.consumidor_domicilio,
            "consumidor_telefono": self.consumidor_telefono,
            "consumidor_email": self.consumidor_email,
            "apoderado_nombre": self.apoderado_nombre,
            "bien_tipo": self.bien_tipo,
            "bien_descripcion": self.bien_descripcion,
            "monto_reclamado": float(self.monto_reclamado) if self.monto_reclamado is not None else None,
            "numero_pedido": self.numero_pedido,
            "tipo": self.tipo,
            "detalle": self.detalle,
            "pedido_consumidor": self.pedido_consumidor,
            "estado": self.estado,
            "respuesta": self.respuesta,
            "fecha_respuesta": self.fecha_respuesta.isoformat() if self.fecha_respuesta else None,
        }
