from app.extensions import db


class Talla(db.Model):
    """Catálogo de tallas (S, M, L, 38, 40, ...).

    Antes cada fila de variantes_producto (y cada item de carrito, cada
    detalle de pedido) guardaba la talla como texto libre repetido; ahora
    todos apuntan aquí por id, así "M" es siempre el mismo registro sin
    importar en cuántos productos aparezca — renombrarlo o corregirlo se
    hace en un solo lugar.

    El registro con nombre='' es un valor especial (placeholder): significa
    "este producto no varía por talla". Se necesita como fila real (no NULL)
    para que el UNIQUE de variantes_producto siga funcionando igual que
    antes — en MySQL, NULL nunca es igual a otro NULL dentro de un UNIQUE.
    """
    __tablename__ = "tallas"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(
        db.String(20).with_variant(db.String(20, collation="utf8mb4_unicode_ci"), "mysql"),
        unique=True, nullable=False,
    )
    orden = db.Column(db.Integer, default=0)  # para mostrarlas siempre en el mismo orden (S, M, L...)

    @classmethod
    def obtener_o_crear(cls, nombre):
        """Busca una talla por nombre (sin importar mayúsculas/espacios) y
        la crea si no existe todavía. Se usa desde el panel admin, donde
        el administrador define el catálogo escribiendo el nombre."""
        nombre = (nombre or "").strip()
        existente = cls.query.filter(db.func.lower(cls.nombre) == nombre.lower()).first()
        if existente:
            return existente
        nueva = cls(nombre=nombre)
        db.session.add(nueva)
        db.session.flush()
        return nueva

    @classmethod
    def por_nombre(cls, nombre):
        """Solo busca, no crea — para cuando el nombre viene de un cliente
        (carrito) y debe corresponder a una talla que ya existe."""
        nombre = (nombre or "").strip()
        return cls.query.filter(db.func.lower(cls.nombre) == nombre.lower()).first()

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "orden": self.orden}

    def __repr__(self):
        return f"<Talla {self.nombre!r}>"


class Color(db.Model):
    """Catálogo de colores. Mismo principio que Talla: nombre='' es el
    placeholder para "este producto no varía por color"."""
    __tablename__ = "colores"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(
        db.String(50).with_variant(db.String(50, collation="utf8mb4_unicode_ci"), "mysql"),
        unique=True, nullable=False,
    )
    codigo_hex = db.Column(db.String(7))  # opcional, para pintar un swatch en el frontend

    @classmethod
    def obtener_o_crear(cls, nombre):
        nombre = (nombre or "").strip()
        existente = cls.query.filter(db.func.lower(cls.nombre) == nombre.lower()).first()
        if existente:
            return existente
        nuevo = cls(nombre=nombre)
        db.session.add(nuevo)
        db.session.flush()
        return nuevo

    @classmethod
    def por_nombre(cls, nombre):
        nombre = (nombre or "").strip()
        return cls.query.filter(db.func.lower(cls.nombre) == nombre.lower()).first()

    def to_dict(self):
        return {"id": self.id, "nombre": self.nombre, "codigo_hex": self.codigo_hex}

    def __repr__(self):
        return f"<Color {self.nombre!r}>"
