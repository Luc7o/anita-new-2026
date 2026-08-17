from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from app.extensions import db
from app.models import Proveedor, ProveedorProducto, Producto
from app.utils.decorators import requiere_roles
from app.roles import PUEDE_VER_PROVEEDORES, PUEDE_GESTIONAR_PROVEEDORES

bp = Blueprint("admin_proveedores", __name__, url_prefix="/api/admin/proveedores")


@bp.get("")
@requiere_roles(*PUEDE_VER_PROVEEDORES)
def listar():
    proveedores = Proveedor.query.options(
        selectinload(Proveedor.productos_suministrados)
    ).order_by(Proveedor.nombre).all()
    return jsonify([p.to_dict() for p in proveedores])


@bp.get("/<int:proveedor_id>")
@requiere_roles(*PUEDE_VER_PROVEEDORES)
def detalle(proveedor_id):
    proveedor = Proveedor.query.options(
        selectinload(Proveedor.productos_suministrados).joinedload(ProveedorProducto.producto)
    ).get_or_404(proveedor_id)
    return jsonify(proveedor.to_dict(con_productos=True))


@bp.post("")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def crear():
    data = request.get_json(force=True) or {}
    nombre = (data.get("nombre") or "").strip()
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    proveedor = Proveedor(
        nombre=nombre,
        contacto_nombre=data.get("contacto_nombre"),
        telefono=data.get("telefono"),
        email=data.get("email"),
        direccion=data.get("direccion"),
        ruc=data.get("ruc"),
        notas=data.get("notas"),
    )
    db.session.add(proveedor)
    db.session.commit()
    return jsonify(proveedor.to_dict()), 201


@bp.put("/<int:proveedor_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def actualizar(proveedor_id):
    proveedor = Proveedor.query.get_or_404(proveedor_id)
    data = request.get_json(force=True) or {}

    campos = ["nombre", "contacto_nombre", "telefono", "email", "direccion", "ruc", "notas", "activo"]
    for campo in campos:
        if campo in data:
            setattr(proveedor, campo, data[campo])

    db.session.commit()
    return jsonify(proveedor.to_dict())


@bp.delete("/<int:proveedor_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def eliminar(proveedor_id):
    proveedor = Proveedor.query.get_or_404(proveedor_id)
    proveedor.activo = False
    db.session.commit()
    return jsonify({"mensaje": "Proveedor desactivado"})


@bp.post("/<int:proveedor_id>/productos")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def agregar_producto(proveedor_id):
    proveedor = Proveedor.query.get_or_404(proveedor_id)
    data = request.get_json(force=True) or {}

    producto_id = data.get("producto_id")
    if not producto_id:
        return jsonify({"error": "Debes seleccionar un producto"}), 400
    producto = Producto.query.get(producto_id)
    if not producto:
        return jsonify({"error": "El producto no existe"}), 404

    precio_compra = data.get("precio_compra")
    if precio_compra not in (None, ""):
        try:
            precio_compra = float(precio_compra)
            if precio_compra < 0:
                return jsonify({"error": "El precio de compra no puede ser negativo"}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "El precio de compra no es un número válido"}), 400
    else:
        precio_compra = None

    existente = ProveedorProducto.query.filter_by(
        proveedor_id=proveedor.id, producto_id=producto.id
    ).first()
    if existente:
        existente.precio_compra = precio_compra
        existente.activo = True
        db.session.commit()
        return jsonify(existente.to_dict()), 200

    relacion = ProveedorProducto(
        proveedor_id=proveedor.id,
        producto_id=producto.id,
        precio_compra=precio_compra,
    )
    db.session.add(relacion)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Ese producto ya está asociado a este proveedor"}), 409
    return jsonify(relacion.to_dict()), 201


@bp.put("/<int:proveedor_id>/productos/<int:relacion_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def actualizar_producto(proveedor_id, relacion_id):
    relacion = ProveedorProducto.query.filter_by(
        id=relacion_id, proveedor_id=proveedor_id
    ).first_or_404()
    data = request.get_json(force=True) or {}

    if "precio_compra" in data:
        precio_compra = data["precio_compra"]
        if precio_compra not in (None, ""):
            try:
                precio_compra = float(precio_compra)
                if precio_compra < 0:
                    return jsonify({"error": "El precio de compra no puede ser negativo"}), 400
            except (TypeError, ValueError):
                return jsonify({"error": "El precio de compra no es un número válido"}), 400
        else:
            precio_compra = None
        relacion.precio_compra = precio_compra

    if "activo" in data:
        relacion.activo = bool(data["activo"])

    db.session.commit()
    return jsonify(relacion.to_dict())


@bp.delete("/<int:proveedor_id>/productos/<int:relacion_id>")
@requiere_roles(*PUEDE_GESTIONAR_PROVEEDORES)
def quitar_producto(proveedor_id, relacion_id):
    relacion = ProveedorProducto.query.filter_by(
        id=relacion_id, proveedor_id=proveedor_id
    ).first_or_404()
    db.session.delete(relacion)
    db.session.commit()
    return jsonify({"mensaje": "Producto desvinculado del proveedor"})
