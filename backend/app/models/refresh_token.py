from datetime import datetime, timedelta

from app.extensions import db


class RefreshToken(db.Model):
    """
    Cada refresh token emitido, por su jti, para que sirva UNA sola vez (ver la migración 006).
    No se guarda el token, solo su identificador: aunque alguien leyera esta tabla no podría
    usarlo para entrar.
    """
    __tablename__ = "refresh_tokens"

    # Margen para dos pestañas que refrescan a la vez con la misma cookie: la segunda llega
    # cuando la primera ya gastó el token. Dentro de este margen no se toma como robo.
    SEGUNDOS_GRACIA_REUSO = 30

    jti = db.Column(db.String(64), primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    creado_en = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expira_en = db.Column(db.DateTime, nullable=False)
    usado_en = db.Column(db.DateTime)

    @classmethod
    def registrar(cls, jti, usuario_id, duracion):
        db.session.add(cls(jti=jti, usuario_id=usuario_id, expira_en=datetime.utcnow() + duracion))

    @classmethod
    def consumir(cls, jti, usuario_id):
        """
        Marca el token como usado. Devuelve:
          "ok"     -> primer uso (o un token emitido antes de esta tabla: se acepta una vez),
          "gracia" -> ya se usó hace muy poco (otra pestaña): se entrega sesión sin alarma,
          "robo"   -> se reutilizó un token ya gastado: hay que cerrar todas las sesiones.
        La fila queda bloqueada hasta el commit, así dos refrescos simultáneos no lo usan a la vez.
        """
        ahora = datetime.utcnow()
        fila = db.session.query(cls).filter_by(jti=jti).with_for_update().first()
        if fila is None:
            # Emitido antes de que existiera esta tabla: vale una vez y queda anotado como usado.
            db.session.add(cls(jti=jti, usuario_id=usuario_id, usado_en=ahora,
                               expira_en=ahora + timedelta(days=30)))
            return "ok"
        if fila.usuario_id != usuario_id:
            return "robo"
        if fila.usado_en is None:
            fila.usado_en = ahora
            return "ok"
        if (ahora - fila.usado_en).total_seconds() <= cls.SEGUNDOS_GRACIA_REUSO:
            return "gracia"
        return "robo"
