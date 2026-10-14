"""
Asigna SKU a los productos existentes que no tienen uno (sku vacío).
No toca los que ya tienen SKU. Es seguro correrlo más de una vez.

Uso (desde la carpeta backend):
    python generar_skus_faltantes.py
"""
from app import create_app
from app.extensions import db
from app.models import Producto
from app.utils.sku import asignar_sku_si_falta

app = create_app()

with app.app_context():
    pendientes = Producto.query.filter(db.or_(Producto.sku.is_(None), Producto.sku == "")).all()
    for p in pendientes:
        asignar_sku_si_falta(p)
        db.session.flush()
        print(f"  producto {p.id} ({p.nombre}) -> {p.sku}")
    db.session.commit()
    print(f"Listo: {len(pendientes)} producto(s) actualizados.")
