import secrets
from datetime import datetime, timedelta
from app.extensions import db


class TokenRecuperacion(db.Model):
    """
    Token de un solo uso para restablecer contraseña. Reemplaza el enfoque
    anterior basado en JWT, que era válido y REUTILIZABLE durante toda su
    ventana de expiración (cualquiera con el link podía usarlo más de una
    vez, y no había forma de invalidarlo antes de tiempo).
    """
    __tablename__ = "tokens_recuperacion"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    usado = db.Column(db.Boolean, default=False, nullable=False)
    expira_en = db.Column(db.DateTime, nullable=False)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def generar(usuario_id, minutos_validez=30):
        # Invalidamos cualquier token anterior sin usar de este usuario, para
        # que pedir un link nuevo deje sin efecto a los anteriores.
        TokenRecuperacion.query.filter_by(usuario_id=usuario_id, usado=False).update({"usado": True})

        token = secrets.token_urlsafe(32)
        registro = TokenRecuperacion(
            usuario_id=usuario_id,
            token=token,
            expira_en=datetime.utcnow() + timedelta(minutes=minutos_validez),
        )
        db.session.add(registro)
        return registro

    @property
    def vigente(self):
        return not self.usado and datetime.utcnow() < self.expira_en
