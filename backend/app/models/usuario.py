from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class Usuario(db.Model):
    __tablename__ = "usuarios"

    TIPOS_DOCUMENTO = {
        "dni": "DNI",
        "ruc": "RUC",
        "ce": "Carné de Extranjería",
    }

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    apellido = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(20))

    # Documento de identidad (DNI / RUC / Carné de Extranjería), validado
    # opcionalmente contra una API de APIs Perú al momento del registro.
    tipo_documento = db.Column(db.String(10))
    numero_documento = db.Column(db.String(15), unique=True)


    # Dirección de envío por defecto
    direccion = db.Column(db.String(200))
    distrito = db.Column(db.String(100))
    provincia = db.Column(db.String(100))
    departamento = db.Column(db.String(100))
    referencia = db.Column(db.String(200))

    activo = db.Column(db.Boolean, default=True)
    es_admin = db.Column(db.Boolean, default=False)  # legado, se mantiene por compatibilidad
    rol = db.Column(db.String(20), default="cliente", nullable=False)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    pedidos = db.relationship(
        "Pedido", backref="cliente", lazy="dynamic",
        cascade="all, delete-orphan", passive_deletes=True,
    )
    carrito = db.relationship(
        "ItemCarrito", backref="usuario", lazy="dynamic",
        cascade="all, delete-orphan", passive_deletes=True,
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"

    @property
    def rol_label(self):
        from app.roles import ROLES
        return ROLES.get(self.rol, self.rol)

    def to_dict(self, incluir_direccion=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "nombre_completo": self.nombre_completo,
            "email": self.email,
            "telefono": self.telefono,
            "tipo_documento": self.tipo_documento,
            "numero_documento": self.numero_documento,
            "es_admin": self.es_admin,
            "rol": self.rol,
            "rol_label": self.rol_label,
            "activo": self.activo,
        }
        if incluir_direccion:
            data.update({
                "direccion": self.direccion,
                "distrito": self.distrito,
                "provincia": self.provincia,
                "departamento": self.departamento,
                "referencia": self.referencia,
            })
        return data

    def __repr__(self):
        return f"<Usuario {self.email}>"
