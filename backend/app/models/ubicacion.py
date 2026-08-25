from app.extensions import db


class UbigeoDepartamento(db.Model):
    """Los 25 departamentos del Perú (catálogo INEI/RENIEC)."""
    __tablename__ = "ubigeo_departamentos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    codigo = db.Column(db.String(2), unique=True, nullable=False)

    provincias = db.relationship("UbigeoProvincia", backref="departamento", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "codigo": self.codigo}

    def __repr__(self):
        return f"<Departamento {self.nombre}>"


class UbigeoProvincia(db.Model):
    """Provincias, cada una ligada a su departamento."""
    __tablename__ = "ubigeo_provincias"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    codigo = db.Column(db.String(4), unique=True, nullable=False)
    departamento_id = db.Column(db.Integer, db.ForeignKey("ubigeo_departamentos.id"), nullable=False)

    distritos = db.relationship("UbigeoDistrito", backref="provincia", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id, "nombre": self.nombre, "codigo": self.codigo,
            "departamento_id": self.departamento_id,
        }

    def __repr__(self):
        return f"<Provincia {self.nombre}>"


class UbigeoDistrito(db.Model):
    """Distritos, cada uno ligado a su provincia (y, para consultas
    rápidas sin tener que subir dos niveles, también a su departamento)."""
    __tablename__ = "ubigeo_distritos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    codigo = db.Column(db.String(6), unique=True, nullable=False)
    provincia_id = db.Column(db.Integer, db.ForeignKey("ubigeo_provincias.id"), nullable=False)
    departamento_id = db.Column(db.Integer, db.ForeignKey("ubigeo_departamentos.id"), nullable=False)

    # Relación directa (además de provincia.departamento) para no tener
    # que subir dos niveles cuando solo se necesita el nombre del depto.
    departamento = db.relationship("UbigeoDepartamento")

    def to_dict(self):
        return {
            "id": self.id, "nombre": self.nombre, "codigo": self.codigo,
            "provincia_id": self.provincia_id, "departamento_id": self.departamento_id,
        }

    def __repr__(self):
        return f"<Distrito {self.nombre}>"
