from datetime import datetime
from app.extensions import db


class Proveedor(db.Model):
    __tablename__ = "proveedores"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    contacto_nombre = db.Column(db.String(120))
    telefono = db.Column(db.String(20))
    email = db.Column(db.String(120))
    direccion = db.Column(db.String(200))
    ruc = db.Column(db.String(20))
    notas = db.Column(db.Text)
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    productos_suministrados = db.relationship(
        "ProveedorProducto", backref="proveedor",
        cascade="all, delete-orphan",
    )

    def to_dict(self, con_productos=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "contacto_nombre": self.contacto_nombre,
            "telefono": self.telefono,
            "email": self.email,
            "direccion": self.direccion,
            "ruc": self.ruc,
            "notas": self.notas,
            "activo": self.activo,
            "cantidad_productos": len([pp for pp in self.productos_suministrados if pp.activo]),
        }
        if con_productos:
            data["productos"] = [pp.to_dict() for pp in self.productos_suministrados]
        return data

    def __repr__(self):
        return f"<Proveedor {self.nombre}>"


class ProveedorProducto(db.Model):
    __tablename__ = "proveedor_productos"
    __table_args__ = (
        db.UniqueConstraint("proveedor_id", "producto_id", name="uq_proveedor_producto"),
    )

    id = db.Column(db.Integer, primary_key=True)
    proveedor_id = db.Column(db.Integer, db.ForeignKey("proveedores.id"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"), nullable=False)
    precio_compra = db.Column(db.Numeric(10, 2))
    activo = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    producto = db.relationship("Producto")

    def to_dict(self):
        return {
            "id": self.id,
            "proveedor_id": self.proveedor_id,
            "producto_id": self.producto_id,
            "precio_compra": float(self.precio_compra) if self.precio_compra is not None else None,
            "activo": self.activo,
            "producto": {
                "id": self.producto.id,
                "nombre": self.producto.nombre,
                "sku": self.producto.sku,
                "imagen_url": self.producto.imagen_url,
                "precio": float(self.producto.precio),
                "stock": self.producto.stock,
            } if self.producto else None,
        }

    def __repr__(self):
        return f"<ProveedorProducto proveedor={self.proveedor_id} producto={self.producto_id}>"
