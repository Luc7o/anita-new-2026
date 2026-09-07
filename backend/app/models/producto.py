from datetime import datetime
from app.extensions import db


class Categoria(db.Model):
    __tablename__ = "categorias"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False, unique=True)
    slug = db.Column(db.String(80), nullable=False, unique=True)
    descripcion = db.Column(db.String(300))
    icono = db.Column(db.String(100), default="bag")
    activo = db.Column(db.Boolean, default=True)

    productos = db.relationship("Producto", backref="categoria", lazy="dynamic")

    CATEGORIAS_DEFAULT = [
        ("Calzados", "calzados", "boot"),
        ("Vestidos", "vestidos", "dress"),
        ("Carteras", "carteras", "handbag"),
        ("Mochilas", "mochilas", "backpack"),
        ("Accesorios", "accesorios", "gem"),
    ]

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "slug": self.slug,
            "descripcion": self.descripcion,
            "icono": self.icono,
            "activo": self.activo,
            "productos_count": self.productos.count(),
        }

    def __repr__(self):
        return f"<Categoria {self.nombre}>"


class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text)

    precio = db.Column(db.Numeric(6, 2), nullable=False)
    precio_oferta = db.Column(db.Numeric(6, 2))

    stock = db.Column(db.Integer, default=0)
    sku = db.Column(db.String(60), unique=True)

    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"), nullable=False)

    imagen_url = db.Column(db.String(400), default="")

    destacado = db.Column(db.Boolean, default=False)
    es_nuevo = db.Column(db.Boolean, default=True)
    activo = db.Column(db.Boolean, default=True)

    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items_carrito = db.relationship(
        "ItemCarrito", backref="producto", lazy="dynamic",
        cascade="all, delete-orphan",
    )
    detalles_pedido = db.relationship("DetallePedido", backref="producto", lazy="dynamic")
    imagenes = db.relationship(
        "ImagenProducto", backref="producto",
        cascade="all, delete-orphan", order_by="ImagenProducto.orden",
    )
    variantes = db.relationship(
        "VarianteProducto", backref="producto",
        cascade="all, delete-orphan",
    )
    resenas = db.relationship(
        "Resena", backref="producto",
        cascade="all, delete-orphan",
    )

    @property
    def total_resenas(self):
        return len(self.resenas)

    @property
    def promedio_calificacion(self):
        if not self.resenas:
            return 0
        return round(sum(r.calificacion for r in self.resenas) / len(self.resenas), 1)

    @property
    def imagenes_lista(self):
        return [img.to_dict() for img in self.imagenes]

    @property
    def imagen_principal(self):
        if self.imagenes:
            return self.imagenes[0].url
        return self.imagen_url  # compatibilidad con productos antiguos

    @property
    def precio_final(self):
        return float(self.precio_oferta) if self.precio_oferta else float(self.precio)

    @property
    def tiene_oferta(self):
        return self.precio_oferta is not None and float(self.precio_oferta) < float(self.precio)

    @property
    def descuento_porcentaje(self):
        if self.tiene_oferta:
            return round((float(self.precio) - float(self.precio_oferta)) / float(self.precio) * 100)
        return 0

    @property
    def usa_variantes(self):
        """True si este producto controla su stock por talla/color en vez de un total único."""
        return len(self.variantes) > 0

    @property
    def variantes_lista(self):
        return [v.to_dict() for v in self.variantes]

    @property
    def stock_total(self):
        if self.usa_variantes:
            return sum(v.stock for v in self.variantes)
        return self.stock or 0

    @property
    def sin_stock(self):
        return self.stock_total <= 0

    def variante_para(self, talla=None, color=None):
        """
        Busca la variante que corresponde a la talla/color pedidos, respetando
        solo los ejes que el producto realmente usa (si no tiene tallas, ignora
        la talla pedida y busca por color=''/talla='' según corresponda).
        """
        if not self.usa_variantes:
            return None
        talla_buscada = (talla or "") if self.tallas_lista else ""
        color_buscado = (color or "") if self.colores_lista else ""
        for v in self.variantes:
            if (v.talla or "") == talla_buscada and (v.color or "") == color_buscado:
                return v
        return None

    @property
    def tallas_lista(self):
        """Tallas distintas que usan las variantes de este producto —
        antes esto vivía repetido también en producto.tallas (texto/JSON),
        ahora se calcula directo de la fuente real (las variantes)."""
        vistas = {}
        for v in self.variantes:
            if v.talla_obj and v.talla_obj.nombre and v.talla_id not in vistas:
                vistas[v.talla_id] = v.talla_obj
        return [t.nombre for t in sorted(vistas.values(), key=lambda t: (t.orden or 0, t.nombre))]

    @property
    def colores_lista(self):
        vistas = {}
        for v in self.variantes:
            if v.color_obj and v.color_obj.nombre and v.color_id not in vistas:
                vistas[v.color_id] = v.color_obj
        return [c.nombre for c in sorted(vistas.values(), key=lambda c: c.nombre)]

    def to_dict(self, resumen=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "precio": float(self.precio),
            "precio_oferta": float(self.precio_oferta) if self.precio_oferta else None,
            "precio_final": self.precio_final,
            "tiene_oferta": self.tiene_oferta,
            "descuento_porcentaje": self.descuento_porcentaje,
            "imagen_url": self.imagen_principal,
            "categoria": self.categoria.slug if self.categoria else None,
            "categoria_id": self.categoria_id,
            "categoria_nombre": self.categoria.nombre if self.categoria else None,
            "destacado": self.destacado,
            "es_nuevo": self.es_nuevo,
            "activo": self.activo,
            "sin_stock": self.sin_stock,
            "tallas": self.tallas_lista,
            "colores": self.colores_lista,
            "usa_variantes": self.usa_variantes,
            "promedio_calificacion": self.promedio_calificacion,
            "total_resenas": self.total_resenas,
            "stock": self.stock_total,
        }
        if not resumen:
            data.update({
                "descripcion": self.descripcion,
                "sku": self.sku,
                "imagenes": self.imagenes_lista,
                "variantes": self.variantes_lista,
            })
        return data

    def __repr__(self):
        return f"<Producto {self.nombre}>"
