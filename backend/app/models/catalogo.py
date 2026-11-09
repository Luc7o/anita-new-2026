from sqlalchemy.dialects.postgresql import CITEXT
from app.extensions import db


class Talla(db.Model):
    """Catálogo de tallas (S, M, L, 38, 40, ...).

    Antes cada fila de variantes_producto (y cada item de carrito, cada
    detalle de pedido) guardaba la talla como texto libre repetido; ahora
    todos apuntan aquí por id, así "M" es siempre el mismo registro sin
    importar en cuántos productos aparezca — renombrarlo o corregirlo se
    hace en un solo lugar.

    Un producto que no varía por talla simplemente no tiene talla en su variante
    (NULL): ya no existe una talla "vacía".
    """
    __tablename__ = "tallas"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(CITEXT, unique=True, nullable=False)  # "m" y "M" son la misma talla
    orden = db.Column(db.Integer, default=0)  # para mostrarlas siempre en el mismo orden (S, M, L...)

    @classmethod
    def obtener_o_crear(cls, nombre):
        """Busca una talla por nombre (sin importar mayúsculas/espacios) y
        la crea si no existe todavía. Se usa desde el panel admin, donde
        el administrador define el catálogo escribiendo el nombre."""
        nombre = (nombre or "").strip()
        if not nombre:
            raise ValueError("El nombre de la talla no puede estar vacío")
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
    """Catálogo de colores. Mismo principio que Talla: un producto que no varía por
    color tiene el color en NULL en su variante."""
    __tablename__ = "colores"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(CITEXT, unique=True, nullable=False)  # "rojo" y "Rojo" son el mismo color
    codigo_hex = db.Column(db.String(7))  # opcional, para pintar un swatch en el frontend

    @classmethod
    def obtener_o_crear(cls, nombre):
        from app.utils.colores import hex_de_color, normalizar_nombre_color

        nombre = normalizar_nombre_color(nombre)
        if not nombre:
            raise ValueError("El nombre del color no puede estar vacío")
        existente = cls.query.filter(db.func.lower(cls.nombre) == nombre.lower()).first()
        if existente:
            return existente
        nuevo = cls(nombre=nombre, codigo_hex=hex_de_color(nombre))
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
