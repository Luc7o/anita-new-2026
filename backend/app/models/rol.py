from app.extensions import db


class Rol(db.Model):
    """Catálogo de roles del sistema (tabla `roles`).

    Los permisos siguen definidos en app/roles.py usando los mismos
    "codigo" (superadmin, moderador, etc.) — esta tabla solo le da
    integridad referencial a `usuarios.rol_id` (evita que alguien guarde
    un rol que no existe).
    """
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<Rol {self.codigo}>"
