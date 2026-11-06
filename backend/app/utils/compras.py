"""
Lógica de compras a proveedores: registrar una compra (sube el stock y deja su
movimiento en el kardex) y anularla (revierte el stock si todavía alcanza).

Las dos funciones no hacen commit: lo hace quien las llama, así el stock, el
kardex y la compra se guardan juntos o no se guarda nada.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from sqlalchemy import text

from app.extensions import db
from app.models import Compra, DetalleCompra, MovimientoStock, Producto, Proveedor, VarianteProducto
from app.utils.stock import _stock_actual

MAX_ITEMS = 100
MAX_CANTIDAD = 100000
MAX_COSTO = Decimal("99999999.99")
CENTAVO = Decimal("0.01")


class ErrorCompra(Exception):
    """Error de validación o de regla de negocio, con un mensaje apto para mostrar."""

    def __init__(self, mensaje, status=400):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.status = status


def _entero(valor, campo, minimo, maximo):
    try:
        if isinstance(valor, bool) or (isinstance(valor, float) and not valor.is_integer()):
            raise ValueError
        n = int(valor)
    except (TypeError, ValueError):
        raise ErrorCompra(f"{campo} no es un número entero válido")
    if n < minimo or n > maximo:
        raise ErrorCompra(f"{campo} debe estar entre {minimo} y {maximo}")
    return n


def _costo(valor):
    try:
        if isinstance(valor, bool):
            raise InvalidOperation
        c = Decimal(str(valor)).quantize(CENTAVO, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError, TypeError):
        raise ErrorCompra("El costo unitario no es un número válido")
    if c < 0 or c > MAX_COSTO:
        raise ErrorCompra("El costo unitario no puede ser negativo")
    return c


def _etiqueta_variante(talla, color):
    partes = [p for p in (f"talla {talla}" if talla else None, color or None) if p]
    return " (" + ", ".join(partes) + ")" if partes else ""


def _validar_cabecera(data):
    proveedor_id = _entero(data.get("proveedor_id"), "El proveedor", 1, 2**31 - 1) if data.get("proveedor_id") else None
    if not proveedor_id:
        raise ErrorCompra("Elige el proveedor de la compra")
    proveedor = db.session.get(Proveedor, proveedor_id)
    if not proveedor:
        raise ErrorCompra("El proveedor no existe")
    if not proveedor.activo:
        raise ErrorCompra("El proveedor está desactivado")

    tipo = (str(data.get("tipo_documento") or "")).strip().lower() or None
    if tipo and tipo not in Compra.TIPOS_DOCUMENTO:
        raise ErrorCompra("Tipo de documento no válido")

    numero_doc = (str(data.get("numero_documento") or "")).strip() or None
    if numero_doc and len(numero_doc) > 40:
        raise ErrorCompra("El número de documento es demasiado largo (máximo 40 caracteres)")

    fecha_txt = data.get("fecha_compra")
    if fecha_txt:
        try:
            fecha = datetime.strptime(str(fecha_txt)[:10], "%Y-%m-%d").date()
        except ValueError:
            raise ErrorCompra("La fecha de la compra no es válida")
        if fecha > date.today() + timedelta(days=1):
            raise ErrorCompra("La fecha de la compra no puede ser futura")
    else:
        fecha = date.today()

    notas = (str(data.get("notas") or "")).strip() or None
    if notas and len(notas) > 1000:
        raise ErrorCompra("Las notas son demasiado largas (máximo 1000 caracteres)")

    # El mismo documento de un proveedor no se registra dos veces: duplicaría el
    # ingreso de stock. Una compra anulada no cuenta (se puede volver a registrar).
    # La base también lo exige (migración 059): esta revisión solo da el mensaje claro.
    if tipo and numero_doc:
        repetida = Compra.query.filter(
            Compra.proveedor_id == proveedor.id,
            Compra.tipo_documento == tipo,
            Compra.numero_documento == numero_doc,
            Compra.estado == "recibida",
        ).first()
        if repetida:
            raise ErrorCompra(
                f"Ya registraste el documento {numero_doc} de este proveedor (compra #{repetida.id}). "
                "Si fue un error, anula esa compra y vuelve a registrarla."
            )

    return proveedor, tipo, numero_doc, fecha, notas


def _validar_items(items_raw):
    if not isinstance(items_raw, list) or not items_raw:
        raise ErrorCompra("Agrega al menos un producto a la compra")
    if len(items_raw) > MAX_ITEMS:
        raise ErrorCompra(f"Una compra admite hasta {MAX_ITEMS} líneas")

    items = []
    for i, raw in enumerate(items_raw, start=1):
        if not isinstance(raw, dict):
            raise ErrorCompra(f"La línea {i} no es válida")
        producto_id = _entero(raw.get("producto_id"), f"Producto de la línea {i}", 1, 2**31 - 1)
        producto = db.session.get(Producto, producto_id)
        if not producto:
            raise ErrorCompra(f"El producto de la línea {i} no existe")

        variante = None
        if producto.usa_variantes:
            if not raw.get("variante_id"):
                raise ErrorCompra(f"Elige talla y color de {producto.nombre} (línea {i})")
            vid = _entero(raw.get("variante_id"), f"Variante de la línea {i}", 1, 2**31 - 1)
            variante = db.session.get(VarianteProducto, vid)
            if not variante or variante.producto_id != producto.id:
                raise ErrorCompra(f"La variante de la línea {i} no pertenece a {producto.nombre}")
        elif raw.get("variante_id"):
            raise ErrorCompra(f"{producto.nombre} no maneja tallas ni colores (línea {i})")

        items.append({
            "producto": producto,
            "variante": variante,
            "cantidad": _entero(raw.get("cantidad"), f"La cantidad de la línea {i}", 1, MAX_CANTIDAD),
            "costo": _costo(raw.get("costo_unitario")),
        })
    return items


def _costo_promedio_nuevo(producto_id, cantidad, costo):
    """
    Costo promedio ponderado: mezcla lo que ya hay en stock (al costo promedio
    que tenía) con lo que entra (al costo de esta compra). Bloquea la fila del
    producto para que dos compras simultáneas no se pisen.
    """
    fila = db.session.execute(
        text("SELECT costo_promedio, stock FROM productos WHERE id = :pid FOR UPDATE"),
        {"pid": producto_id},
    ).first()
    suma_variantes = db.session.execute(
        text("SELECT COUNT(*) AS n, COALESCE(SUM(stock), 0) AS total FROM variantes_producto WHERE producto_id = :pid"),
        {"pid": producto_id},
    ).first()
    stock_total = int(suma_variantes.total) if suma_variantes.n else int(fila.stock or 0)

    if fila.costo_promedio is not None and stock_total > 0:
        nuevo = (Decimal(stock_total) * Decimal(fila.costo_promedio) + Decimal(cantidad) * costo) / Decimal(stock_total + cantidad)
    else:
        nuevo = costo
    return nuevo.quantize(CENTAVO, rounding=ROUND_HALF_UP)


def registrar_compra(data, usuario_id):
    """Valida y registra una compra. Devuelve la Compra (sin commit). Lanza ErrorCompra."""
    proveedor, tipo, numero_doc, fecha, notas = _validar_cabecera(data)
    items = _validar_items(data.get("items"))

    compra = Compra(
        proveedor_id=proveedor.id, tipo_documento=tipo, numero_documento=numero_doc,
        fecha_compra=fecha, notas=notas, usuario_id=usuario_id, estado="recibida",
        total=sum((it["costo"] * it["cantidad"] for it in items), Decimal("0")),
    )
    db.session.add(compra)
    db.session.flush()

    # Siempre en el mismo orden, así dos compras simultáneas no se traban entre sí.
    items.sort(key=lambda it: (it["producto"].id, it["variante"].id if it["variante"] else 0))

    for it in items:
        producto, variante, cantidad, costo = it["producto"], it["variante"], it["cantidad"], it["costo"]

        nuevo_costo = _costo_promedio_nuevo(producto.id, cantidad, costo)

        if variante:
            db.session.execute(
                text("UPDATE variantes_producto SET stock = stock + :c WHERE id = :vid AND producto_id = :pid"),
                {"c": cantidad, "vid": variante.id, "pid": producto.id},
            )
        else:
            db.session.execute(
                text("UPDATE productos SET stock = stock + :c WHERE id = :pid"),
                {"c": cantidad, "pid": producto.id},
            )
        db.session.execute(
            text("UPDATE productos SET costo_promedio = :v WHERE id = :pid"),
            {"v": nuevo_costo, "pid": producto.id},
        )

        stock_despues = _stock_actual(variante_id=variante.id if variante else None, producto_id=producto.id)

        db.session.add(DetalleCompra(
            compra_id=compra.id, producto_id=producto.id,
            variante_id=variante.id if variante else None,
            talla=(variante.talla or None) if variante else None,
            color=(variante.color or None) if variante else None,
            cantidad=cantidad, costo_unitario=costo, subtotal=costo * cantidad,
        ))
        db.session.add(MovimientoStock(
            variante_id=variante.id if variante else None,
            producto_id=producto.id,
            tipo="ingreso_compra",
            cantidad=cantidad,
            usuario_id=usuario_id,
            motivo=f"Compra {compra.numero}",
            stock_antes=(stock_despues - cantidad) if stock_despues is not None else None,
            stock_despues=stock_despues,
            costo_unitario=costo,
            proveedor_id=proveedor.id,
            compra_id=compra.id,
        ))

    db.session.flush()
    return compra


def anular_compra(compra, usuario_id, motivo):
    """
    Anula una compra y descuenta lo que ingresó. Solo se puede si el stock de
    cada línea todavía alcanza (si ya se vendió parte de esa mercadería, hay
    que corregirla con un ajuste, no anulando). Lanza ErrorCompra.

    El costo promedio del producto no se recalcula al anular.
    """
    motivo = (motivo or "").strip()
    if len(motivo) < 3:
        raise ErrorCompra("Escribe el motivo de la anulación")
    if len(motivo) > 200:
        raise ErrorCompra("El motivo es demasiado largo (máximo 200 caracteres)")
    if compra.estado == "anulada":
        raise ErrorCompra("Esta compra ya está anulada", status=409)

    detalles = sorted(compra.detalles, key=lambda d: (d.producto_id, d.variante_id or 0))
    for d in detalles:
        producto = db.session.get(Producto, d.producto_id)
        variante_id = d.variante_id
        if variante_id is None and producto.usa_variantes:
            variante = producto.variante_para(d.talla or "", d.color or "")
            variante_id = variante.id if variante else None
            if variante_id is None:
                raise ErrorCompra(
                    f"No se puede anular: la variante{_etiqueta_variante(d.talla, d.color)} de "
                    f"{producto.nombre} ya no existe.", status=409,
                )

        if variante_id is not None:
            resultado = db.session.execute(
                text("UPDATE variantes_producto SET stock = stock - :c WHERE id = :vid AND stock >= :c"),
                {"c": d.cantidad, "vid": variante_id},
            )
        else:
            resultado = db.session.execute(
                text("UPDATE productos SET stock = stock - :c WHERE id = :pid AND stock >= :c"),
                {"c": d.cantidad, "pid": d.producto_id},
            )
        if resultado.rowcount == 0:
            actual = _stock_actual(variante_id=variante_id, producto_id=d.producto_id)
            raise ErrorCompra(
                f"No se puede anular: de {producto.nombre}{_etiqueta_variante(d.talla, d.color)} ingresaron "
                f"{d.cantidad} unidades y ahora solo quedan {actual}. Ya se vendió parte de esa mercadería, "
                f"corrígelo con un ajuste de stock.", status=409,
            )

        stock_despues = _stock_actual(variante_id=variante_id, producto_id=d.producto_id)
        db.session.add(MovimientoStock(
            variante_id=variante_id,
            producto_id=d.producto_id,
            tipo="anulacion_compra",
            cantidad=-d.cantidad,
            usuario_id=usuario_id,
            motivo=f"Anulación de {compra.numero}: {motivo}"[:255],
            stock_antes=(stock_despues + d.cantidad) if stock_despues is not None else None,
            stock_despues=stock_despues,
            costo_unitario=d.costo_unitario,
            proveedor_id=compra.proveedor_id,
            compra_id=compra.id,
        ))

    compra.estado = "anulada"
    compra.anulada_por = usuario_id
    compra.fecha_anulacion = datetime.utcnow()
    compra.motivo_anulacion = motivo
    db.session.flush()
