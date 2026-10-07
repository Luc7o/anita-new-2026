from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


def _rol_cliente_por_defecto(context):
    """Valor por defecto de rol_id cuando se crea un Usuario sin indicar
    rol explícitamente (igual que antes: default="cliente")."""
    from app.models.rol import Rol
    return Rol.query.filter_by(codigo="cliente").first().id


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
    # Nullable: una cuenta de checkout como invitado (ver /auth/invitado) se
    # crea SIN contraseña — la persona compra sin pasar por el registro
    # completo, y puede ponerle contraseña después si quiere (ver
    # es_invitado más abajo y /auth/completar-cuenta).
    password_hash = db.Column(db.String(255), nullable=True)
    telefono = db.Column(db.String(20))

    # Documento de identidad (DNI / RUC / Carné de Extranjería), validado
    # opcionalmente contra una API de APIs Perú al momento del registro.
    tipo_documento = db.Column(db.String(10))
    numero_documento = db.Column(db.String(15), unique=True)

    # Dirección de envío por defecto. El departamento/provincia ya no se
    # repiten como texto: se obtienen a través de distrito_id -> provincia
    # -> departamento (normalización, ver migración 022).
    direccion = db.Column(db.String(200))
    distrito_id = db.Column(db.Integer, db.ForeignKey("ubigeo_distritos.id"), nullable=True)
    referencia = db.Column(db.String(200))

    # Respaldo de texto libre de antes de la migración 022, por si algún
    # registro no calzó exacto con el catálogo oficial. Ya no se usa en la
    # aplicación, solo queda como histórico.
    distrito_legacy = db.Column(db.String(100))
    provincia_legacy = db.Column(db.String(100))
    departamento_legacy = db.Column(db.String(100))
    rol_legacy = db.Column(db.String(20))

    activo = db.Column(db.Boolean, default=True)
    es_admin = db.Column(db.Boolean, default=False)  # legado, se mantiene por compatibilidad
    # Cuenta creada por /auth/invitado (checkout como invitado), sin
    # contraseña todavía. No tiene ningún efecto en permisos — solo indica
    # que le falta poner contraseña si quiere volver a entrar después. Se
    # pone en False en cuanto la persona la completa (/auth/completar-cuenta)
    # o si en algún momento hace login normal (lo cual no podría pasar sin
    # password_hash, así que en la práctica solo cambia vía ese endpoint).
    es_invitado = db.Column(db.Boolean, nullable=False, default=False)
    rol_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False, default=_rol_cliente_por_defecto)
    # Contador de revocación de sesiones. Todo access/refresh token que se
    # emite lleva grabado este valor en su claim "sv" (ver create_app en
    # app/__init__.py y las funciones _tokens_para en app/routes/auth.py).
    # Subirlo (logout, cambio de contraseña, restablecer contraseña) hace
    # que cualquier token emitido con un valor anterior deje de servir de
    # inmediato, sin esperar a que expire por tiempo — incluye tokens ya
    # en uso en otros dispositivos/pestañas.
    sesion_version = db.Column(db.Integer, nullable=False, default=1)
    # Bloqueo de cuenta tras varios intentos de login fallidos seguidos.
    # Vive en esta misma tabla (no en Redis/memoria) para que funcione
    # igual sin importar si REDIS_URL está configurado o no, y sea
    # consistente entre todas las instancias serverless.
    intentos_fallidos_login = db.Column(db.Integer, nullable=False, default=0)
    bloqueado_hasta = db.Column(db.DateTime, nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    rol_obj = db.relationship("Rol", lazy="joined")
    distrito_obj = db.relationship("UbigeoDistrito", lazy="joined")

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

    UMBRAL_INTENTOS_FALLIDOS = 5
    DURACION_BLOQUEO = timedelta(minutes=15)

    @property
    def esta_bloqueado(self):
        return self.bloqueado_hasta is not None and datetime.utcnow() < self.bloqueado_hasta

    def registrar_intento_fallido(self):
        """Se llama tras un password incorrecto. Al llegar al umbral,
        bloquea la cuenta por un rato — este contador vive en MySQL, así
        que funciona igual sin importar si el rate limiter tiene Redis."""
        self.intentos_fallidos_login += 1
        if self.intentos_fallidos_login >= self.UMBRAL_INTENTOS_FALLIDOS:
            self.bloqueado_hasta = datetime.utcnow() + self.DURACION_BLOQUEO

    def resetear_intentos_fallidos(self):
        self.intentos_fallidos_login = 0
        self.bloqueado_hasta = None

    def check_password(self, password):
        # Cuenta de invitado sin contraseña todavía: nunca puede loguearse
        # por email/password hasta que se le ponga una (completar-cuenta).
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"

    # --- Compatibilidad: el resto del código (decoradores, rutas, scripts)
    # sigue usando `usuario.rol` como si fuera un string ("cliente",
    # "superadmin", etc.), igual que antes de normalizar. Por dentro ahora
    # es una referencia a la tabla `roles`, pero de afuera se ve y se usa
    # exactamente igual.
    @property
    def rol(self):
        return self.rol_obj.codigo if self.rol_obj else None

    @rol.setter
    def rol(self, codigo):
        from app.models.rol import Rol
        rol = Rol.query.filter_by(codigo=codigo).first()
        if not rol:
            raise ValueError(f"Rol inválido: {codigo}")
        self.rol_obj = rol

    @property
    def rol_label(self):
        from app.roles import ROLES
        return ROLES.get(self.rol, self.rol)

    # --- Igual para la ubicación: se puede seguir leyendo
    # usuario.distrito / .provincia / .departamento como texto (por
    # ejemplo en culqi.py), aunque ahora vienen de las tablas ubigeo_*.
    @property
    def distrito(self):
        return self.distrito_obj.nombre if self.distrito_obj else None

    @property
    def provincia(self):
        return self.distrito_obj.provincia.nombre if self.distrito_obj else None

    @property
    def departamento(self):
        return self.distrito_obj.departamento.nombre if self.distrito_obj else None

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
            "es_invitado": self.es_invitado,
            "rol": self.rol,
            "rol_label": self.rol_label,
            "activo": self.activo,
        }
        if incluir_direccion:
            data.update({
                "direccion": self.direccion,
                "distrito_id": self.distrito_id,
                "distrito": self.distrito,
                "provincia_id": self.distrito_obj.provincia_id if self.distrito_obj else None,
                "provincia": self.provincia,
                "departamento_id": self.distrito_obj.departamento_id if self.distrito_obj else None,
                "departamento": self.departamento,
                "referencia": self.referencia,
            })
        return data

    def __repr__(self):
        return f"<Usuario {self.email}>"
