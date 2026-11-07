from datetime import datetime

from app.extensions import db
from app.utils.totp import hash_codigo_respaldo


class CodigoRespaldo(db.Model):
    """Un código de respaldo del 2FA, guardado solo como hash (nunca el código).

    Una fila por código, en vez de una lista dentro de una columna de usuarios.
    Gastar un código es un UPDATE que solo funciona si todavía no se usó, así que
    dos intentos simultáneos con el mismo código no pueden pasar los dos."""
    __tablename__ = "codigos_respaldo"
    __table_args__ = (
        db.UniqueConstraint("usuario_id", "codigo_hash", name="uq_codigos_respaldo_usuario_hash"),
    )

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(
        db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE", name="fk_codigos_respaldo_usuario"),
        nullable=False,
    )
    codigo_hash = db.Column(db.String(64), nullable=False)
    usado_en = db.Column(db.DateTime, nullable=True)
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @classmethod
    def reemplazar(cls, usuario_id, hashes):
        """Deja como únicos códigos del usuario los de esta lista. No hace commit."""
        cls.query.filter_by(usuario_id=usuario_id).delete(synchronize_session=False)
        for hash_codigo in hashes:
            db.session.add(cls(usuario_id=usuario_id, codigo_hash=hash_codigo))

    @classmethod
    def consumir(cls, usuario_id, codigo):
        """Gasta el código si existe y no se usó. Devuelve True si pudo gastarlo.
        No hace commit."""
        filas = cls.query.filter(
            cls.usuario_id == usuario_id,
            cls.codigo_hash == hash_codigo_respaldo(codigo or ""),
            cls.usado_en.is_(None),
        ).update({"usado_en": datetime.utcnow()}, synchronize_session=False)
        return filas == 1

    @classmethod
    def restantes(cls, usuario_id):
        return cls.query.filter_by(usuario_id=usuario_id, usado_en=None).count()

    @classmethod
    def borrar_de(cls, usuario_id):
        """Elimina todos los códigos del usuario. No hace commit."""
        cls.query.filter_by(usuario_id=usuario_id).delete(synchronize_session=False)

    def __repr__(self):
        return f"<CodigoRespaldo usuario={self.usuario_id} usado={self.usado_en is not None}>"
