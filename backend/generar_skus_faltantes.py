"""
Completa los SKU que falten en los datos existentes. No toca los que ya
tienen SKU, así que es seguro correrlo más de una vez.

  1. Productos sin SKU            -> PREFIJO-000123
  2. Variantes (talla/color) sin SKU -> PREFIJO-000123-M-ROJ
  3. Líneas de pedido sin SKU     -> se copia el de la variante o, si ya no
                                     existe, el del producto.

Uso (desde la carpeta backend, DESPUÉS de aplicar la migración 042):
    python generar_skus_faltantes.py
"""
from app import create_app
from app.extensions import db
from app.models import Producto, VarianteProducto, DetallePedido
from app.utils.sku import asignar_sku_si_falta, asignar_skus_variantes

app = create_app()

with app.app_context():
    # 1) Productos
    pendientes = Producto.query.filter(db.or_(Producto.sku.is_(None), Producto.sku == "")).all()
    for p in pendientes:
        asignar_sku_si_falta(p)
        db.session.flush()
        print(f"  producto {p.id} ({p.nombre}) -> {p.sku}")
    print(f"Productos: {len(pendientes)} actualizado(s).")

    # 2) Variantes
    ids = [
        fila[0] for fila in db.session.query(VarianteProducto.producto_id)
        .filter(db.or_(VarianteProducto.sku.is_(None), VarianteProducto.sku == ""))
        .distinct().all()
    ]
    total_variantes = 0
    for producto_id in ids:
        producto = Producto.query.get(producto_id)
        antes = VarianteProducto.query.filter_by(producto_id=producto_id).filter(
            db.or_(VarianteProducto.sku.is_(None), VarianteProducto.sku == "")
        ).count()
        asignar_skus_variantes(producto)
        total_variantes += antes
        print(f"  producto {producto.id} ({producto.nombre}): {antes} variante(s)")
    print(f"Variantes: {total_variantes} actualizada(s).")

    # 3) Pedidos históricos
    detalles = DetallePedido.query.filter(db.or_(DetallePedido.sku.is_(None), DetallePedido.sku == "")).all()
    completados = 0
    for d in detalles:
        variante = VarianteProducto.query.get(d.variante_id) if d.variante_id else None
        d.sku = (variante.sku if variante and variante.sku else (d.producto.sku if d.producto else None))
        if d.sku:
            completados += 1
    print(f"Líneas de pedido: {completados} de {len(detalles)} completadas.")

    db.session.commit()
    print("Listo.")
