from datetime import datetime

from app.extensions import db


class ConsentimientoPrivacidad(db.Model):
    """
    Decisión de una persona sobre las estadísticas de uso (ver migración 005).
    Solo las filas 'aceptado' tienen sesion_id; al rechazar o retirar no queda ningún
    identificador del visitante.
    """
    __tablename__ = "consentimientos_privacidad"

    DECISIONES = ("aceptado", "rechazado", "retirado")

    id = db.Column(db.BigInteger, primary_key=True)
    finalidad = db.Column(db.String(20), nullable=False, default="analitica")
    decision = db.Column(db.String(10), nullable=False)
    version = db.Column(db.String(20), nullable=False)
    sesion_id = db.Column(db.String(64), unique=True, nullable=True)
    decidido_en = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    retirado_en = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<ConsentimientoPrivacidad {self.finalidad} {self.decision} v{self.version}>"
