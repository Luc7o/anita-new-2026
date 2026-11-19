"""
Carga datos de PRUEBA para ver el panel admin con vida: gráficos, productos,
pedidos, visitas, kardex, etc. NO es para producción con clientes reales.

Uso (desde la carpeta backend, con el venv activo y DATABASE_URL apuntando a la base):
    python seed.py             # muestra a qué base apunta y pide confirmación
    python seed.py --si        # sin preguntar
    python seed.py --forzar    # permite cargar aunque ya existan pedidos reales

Qué crea (todo coherente entre sí, con las mismas reglas que usa la app):
- Categorías, 3 proveedores y 14 productos con variantes (talla x color). El stock sale
  de compras a proveedores, y cada venta/cancelación/merma deja su movimiento en el kardex.
- 24 clientes de prueba (correos @prueba.anita-new-style.test, sin contraseña: no se
  pueden usar para entrar).
- ~165 pedidos repartidos en los últimos 6 meses, con tendencia creciente: entregados,
  en camino, pendientes, pagos por revisar, cancelados, rechazados y un reembolso.
  Mezcla compras en línea (Yape y tarjeta, delivery y recojo) y ventas en tienda.
- Visitas de la tienda (hoy y últimos 7 días), embudo de compra, carritos abandonados,
  intentos de pago, latencia del servidor, reseñas y reclamos.
- Un producto agotado y tres con poco stock, para que se vea el aviso de stock.

Es seguro correrlo más de una vez: si detecta que ya cargó los datos de prueba, no
hace nada. Para empezar de cero: python limpiar_datos_prueba.py y luego python seed.py.
Todo ocurre en UNA transacción: si algo falla, no queda nada a medias.

Las fotos de los productos NO se cargan (se suben desde el panel: Productos > editar).
Los usuarios y la configuración de la tienda no se tocan.
"""
import random
import sys
import unicodedata
from datetime import date, datetime, timedelta
from urllib.parse import urlparse

from app import create_app
from app.extensions import db
from app.models import (
    Categoria, Compra, DetalleCompra, DetallePedido, EventoAnalitica,
    HistorialEstadoPedido, IntentoPago, ItemCarrito, LatenciaRequest, MovimientoStock,
    Pedido, Producto, Proveedor, Reclamacion, Resena, Rol, Usuario, VarianteProducto,
)

app = create_app()
rng = random.Random(2026)  # misma semilla = mismos datos cada vez

PATRON_PEDIDO_SEED = "ANS-________-S_____"  # los pedidos reales llevan 6 caracteres hexadecimales: nunca una "S"
DOMINIO_PRUEBA = "prueba.anita-new-style.test"

TALLAS_ZAPATO = ["36", "37", "38", "39"]
TALLAS_PANTUFLA = ["26", "27", "28", "29", "30"]
TALLAS_SANDALIA = ["35", "36", "37", "38", "39"]

CATEGORIAS = [
    ("Carteras", "carteras", "Carteras, bolsos y bandoleras"),
    ("Calzados", "calzados", "Sandalias, zapatillas y botines"),
    ("Mochilas", "mochilas", "Mochilas urbanas y escolares"),
    ("Accesorios", "accesorios", "Billeteras, cinturones y más"),
]

# prov: 0 = cueros, 1 = calzado, 2 = accesorios. peso = qué tanto se vende (para el ranking).
# stock = stock FINAL que queda hoy. restock = recibe una segunda compra hace ~40 días.
PRODUCTOS = [
    {"sku": "ANS-R001", "cat": "carteras", "genero": "mujer", "nombre": "Cartera Hobo Floral con Borla",
     "desc": "Cartera hobo de hombro en cuero sintético texturizado, con relieve floral, borla decorativa, herrajes dorados y bolsillo exterior con cierre.",
     "precio": 89.90, "oferta": None, "dest": True, "nuevo": True, "tallas": [], "colores": ["Vino", "Negro", "Beige"], "stock": 18, "prov": 0, "peso": 9, "restock": True},
    {"sku": "ANS-R002", "cat": "calzados", "genero": "nina", "nombre": "Pantuflas Peluche Pingüino Niña",
     "desc": "Pantuflas de peluche suave con diseño de pingüino y lazo, suela antideslizante de goma. Abrigadas y cómodas para casa.",
     "precio": 39.90, "oferta": 34.90, "dest": False, "nuevo": True, "tallas": TALLAS_PANTUFLA, "colores": ["Rosa"], "stock": 25, "prov": 1, "peso": 6, "restock": False},
    {"sku": "ANS-R003", "cat": "mochilas", "genero": "mujer", "nombre": "Mochila Urbana Cuero Marrón",
     "desc": "Mochila urbana en cuero sintético con múltiples compartimentos, bolsillos con cierre, correas ajustables y asa superior.",
     "precio": 119.90, "oferta": None, "dest": True, "nuevo": False, "tallas": [], "colores": ["Marrón"], "stock": 10, "prov": 0, "peso": 5, "restock": False},
    {"sku": "ANS-R004", "cat": "calzados", "genero": "mujer", "nombre": "Sandalias Plataforma Strass",
     "desc": "Sandalias de plataforma y taco ancho con tiras de strass y pulsera al tobillo con hebilla. Ideales para fiestas y ocasiones especiales.",
     "precio": 149.90, "oferta": 129.90, "dest": True, "nuevo": True, "tallas": TALLAS_SANDALIA, "colores": ["Crema", "Plateado", "Dorado", "Blanco"], "stock": 40, "prov": 1, "peso": 10, "restock": True},
    {"sku": "ANS-R005", "cat": "carteras", "genero": "mujer", "nombre": "Cartera Charol Rosa",
     "desc": "Cartera estructurada de charol brillante con doble asa, herrajes dorados y amplio interior. Un clásico para el día a día.",
     "precio": 99.90, "oferta": None, "dest": False, "nuevo": True, "tallas": [], "colores": ["Rosa"], "stock": 8, "prov": 0, "peso": 5, "restock": False},
    {"sku": "ANS-R006", "cat": "carteras", "genero": "mujer", "nombre": "Cartera Domo Roja",
     "desc": "Cartera tipo domo con doble asa y correa larga desmontable, cierre superior y bolsillo trasero con cierre. Herrajes dorados.",
     "precio": 129.90, "oferta": 109.90, "dest": False, "nuevo": False, "tallas": [], "colores": ["Rojo"], "stock": 7, "prov": 0, "peso": 4, "restock": False},
    {"sku": "ANS-T001", "cat": "accesorios", "genero": "mujer", "nombre": "Billetera Cuero Vino",
     "desc": "Billetera mediana con cierre, múltiples tarjeteros y monedero. Cuero sintético de acabado suave.",
     "precio": 49.90, "oferta": None, "dest": False, "nuevo": True, "tallas": [], "colores": ["Vino", "Negro"], "stock": 3, "prov": 2, "peso": 5, "restock": False},
    {"sku": "ANS-T002", "cat": "accesorios", "genero": "unisex", "nombre": "Cinturón Clásico Hebilla Dorada",
     "desc": "Cinturón de cuero sintético con hebilla dorada. Combina con jeans y vestidos.",
     "precio": 39.90, "oferta": None, "dest": False, "nuevo": False, "tallas": ["S", "M", "L"], "colores": ["Negro"], "stock": 0, "prov": 2, "peso": 4, "restock": False},
    {"sku": "ANS-T003", "cat": "calzados", "genero": "mujer", "nombre": "Zapatillas Urbanas Blancas",
     "desc": "Zapatillas urbanas de suela alta, ligeras y cómodas. Perfectas para el día a día.",
     "precio": 139.90, "oferta": 119.90, "dest": True, "nuevo": True, "tallas": TALLAS_ZAPATO, "colores": ["Blanco", "Negro"], "stock": 22, "prov": 1, "peso": 8, "restock": True},
    {"sku": "ANS-T004", "cat": "calzados", "genero": "mujer", "nombre": "Botines Cuero Negro",
     "desc": "Botines de cuero con taco medio y cierre lateral. Elegantes y resistentes.",
     "precio": 179.90, "oferta": None, "dest": False, "nuevo": False, "tallas": ["37", "38"], "colores": ["Negro"], "stock": 2, "prov": 1, "peso": 3, "restock": False},
    {"sku": "ANS-T005", "cat": "calzados", "genero": "mujer", "nombre": "Sandalias Planas Trenzadas",
     "desc": "Sandalias planas con tiras trenzadas y suela flexible. Frescas para el verano.",
     "precio": 69.90, "oferta": None, "dest": False, "nuevo": True, "tallas": TALLAS_ZAPATO, "colores": ["Camel", "Negro"], "stock": 30, "prov": 1, "peso": 6, "restock": False},
    {"sku": "ANS-T006", "cat": "mochilas", "genero": "unisex", "nombre": "Mochila Escolar Reforzada",
     "desc": "Mochila escolar con espalda acolchada, compartimento para laptop y tela resistente al agua.",
     "precio": 89.90, "oferta": None, "dest": False, "nuevo": False, "tallas": [], "colores": ["Azul", "Rosa"], "stock": 14, "prov": 0, "peso": 4, "restock": False},
    {"sku": "ANS-T007", "cat": "carteras", "genero": "mujer", "nombre": "Bolso Tote Lona Natural",
     "desc": "Bolso tote amplio de lona gruesa con asas reforzadas y bolsillo interior con cierre.",
     "precio": 59.90, "oferta": 49.90, "dest": False, "nuevo": True, "tallas": [], "colores": ["Beige", "Negro"], "stock": 20, "prov": 0, "peso": 5, "restock": False},
    {"sku": "ANS-T008", "cat": "carteras", "genero": "mujer", "nombre": "Cartera Bandolera Mini",
     "desc": "Bandolera pequeña con correa ajustable y cierre magnético. Ideal para salir.",
     "precio": 79.90, "oferta": None, "dest": True, "nuevo": True, "tallas": [], "colores": ["Rojo", "Negro", "Rosa palo"], "stock": 16, "prov": 0, "peso": 7, "restock": True},
]

PROVEEDORES = [
    {"nombre": "Cueros del Centro SAC", "ruc": "20999000011", "contacto": "Marta Salazar", "tel": "964000111"},
    {"nombre": "Calzados Andinos EIRL", "ruc": "20999000022", "contacto": "Julio Paredes", "tel": "964000222"},
    {"nombre": "Accesorios Lima Norte SAC", "ruc": "20999000033", "contacto": "Carmen Díaz", "tel": "964000333"},
]

NOMBRES = ["María", "Lucía", "Camila", "Valeria", "Sofía", "Andrea", "Daniela", "Fiorella", "Rosa", "Elena", "Paola", "Carla",
           "Jorge", "Luis", "Diego", "Carlos", "Miguel", "Tomás", "Renzo", "Marco", "Ana", "Gabriela", "Milagros", "Pamela"]
APELLIDOS = ["Quispe", "Huamán", "Rojas", "Vargas", "Mendoza", "Paredes", "Flores", "Salazar", "Castro", "Ríos", "Torres", "Cruz",
             "Ramos", "Gómez", "Soto", "Medina", "Chávez", "Lazo", "Poma", "Ccora", "Aliaga", "Ñahui", "Surichaqui", "Yauri"]
DISTRITOS = [(1048, "Huancayo"), (1057, "El Tambo"), (1052, "Chilca")]  # ids del ubigeo (migración 002)
MOTIVOS_RECHAZO = ["Fondos insuficientes", "Tarjeta rechazada por el banco", "Código de seguridad incorrecto", "Transacción no permitida"]
COMENTARIOS = ["Muy linda, tal como en las fotos.", "Llegó rápido y bien empacada.", "Buena calidad por el precio.",
               "Me encantó, la recomiendo.", "El color es hermoso.", "Cómoda y de buen material."]
ENDPOINTS = ["/api/productos", "/api/productos/<id>", "/api/carrito", "/api/pedidos", "/api/auth/perfil", "/api/categorias", "/api/admin/pedidos/resumen/estadisticas"]


def sin_tildes(texto):
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower().replace(" ", "")


def horas(n):
    return timedelta(hours=n)


def repartir(total, partes):
    base, resto = divmod(total, partes)
    return [base + (1 if i < resto else 0) for i in range(partes)]


def meses_atras(ahora, n):
    """Primer día del mes que está n meses antes del actual (a medianoche)."""
    indice = ahora.year * 12 + ahora.month - 1 - n
    return datetime(indice // 12, indice % 12 + 1, 1)


def fecha_al_azar(desde, hasta):
    return desde + timedelta(seconds=rng.randint(0, max(1, int((hasta - desde).total_seconds()))))


def conectar_y_avisar(argumentos):
    with app.app_context():
        host = urlparse(db.engine.url.render_as_string(hide_password=True)).hostname
        print(f"Base de datos: {host}")
        ya_hay_seed = Pedido.query.filter(Pedido.numero_pedido.like(PATRON_PEDIDO_SEED)).count()
        pedidos_reales = Pedido.query.filter(~Pedido.numero_pedido.like(PATRON_PEDIDO_SEED)).count()
        skus = [p["sku"] for p in PRODUCTOS]
        skus_existentes = [s for (s,) in db.session.query(Producto.sku).filter(Producto.sku.in_(skus)).all()]
    if ya_hay_seed:
        print(f"Ya hay {ya_hay_seed} pedidos de prueba cargados. No se hace nada.\n"
              "Para empezar de cero: python limpiar_datos_prueba.py y luego python seed.py")
        return False
    if pedidos_reales and "--forzar" not in argumentos:
        print(f"⚠️  Esta base ya tiene {pedidos_reales} pedido(s) que NO son de prueba.\n"
              "Este script es para bases de prueba. Si de verdad quieres mezclar, corre: python seed.py --forzar")
        return False
    if skus_existentes:
        print(f"❌ Ya existen productos con estos SKU: {', '.join(skus_existentes)}.\n"
              "Borra los datos de prueba (python limpiar_datos_prueba.py) y vuelve a correr este script.")
        return False
    if "--si" not in argumentos:
        if input("\nEscribe CARGAR para crear los datos de prueba (otra cosa cancela): ").strip() != "CARGAR":
            print("Cancelado, no se creó nada.")
            return False
    return True


# ---------------------------------------------------------------------------
# Catálogo y clientes
# ---------------------------------------------------------------------------
def crear_catalogo():
    categorias = {}
    for nombre, slug, descripcion in CATEGORIAS:
        categoria = Categoria.query.filter_by(slug=slug).first()
        if not categoria:
            categoria = Categoria(nombre=nombre, slug=slug, descripcion=descripcion)
            db.session.add(categoria)
        categorias[slug] = categoria
    db.session.flush()

    proveedores = []
    for datos in PROVEEDORES:
        proveedor = Proveedor.query.filter_by(ruc=datos["ruc"]).first() or Proveedor(
            nombre=datos["nombre"], ruc=datos["ruc"], contacto_nombre=datos["contacto"], telefono=datos["tel"],
            email=f"ventas@{sin_tildes(datos['nombre'])[:14]}.test", notas="Proveedor de prueba (seed.py)",
        )
        db.session.add(proveedor)
        proveedores.append(proveedor)

    productos = []
    for datos in PRODUCTOS:
        producto = Producto(
            nombre=datos["nombre"], descripcion=datos["desc"], precio=datos["precio"], precio_oferta=datos["oferta"],
            sku=datos["sku"], categoria_id=categorias[datos["cat"]].id, genero=datos["genero"],
            destacado=datos["dest"], es_nuevo=datos["nuevo"], costo_promedio=round(datos["precio"] * 0.5, 2),
        )
        combinaciones = [(t, c) for c in datos["colores"] for t in (datos["tallas"] or [""])]
        # El stock FINAL de cada variante se reparte aquí; las compras se calculan después
        # para que el kardex cuadre exactamente con este número.
        for (talla, color), stock in zip(combinaciones, repartir(datos["stock"], len(combinaciones))):
            variante = VarianteProducto(stock=stock)
            variante.talla = talla
            variante.color = color
            producto.variantes.append(variante)
        db.session.add(producto)
        productos.append((datos, producto))
    db.session.flush()
    return proveedores, productos


def crear_clientes():
    clientes = []
    for i in range(24):
        nombre, apellido = NOMBRES[i], APELLIDOS[i]
        distrito_id, _ = DISTRITOS[i % len(DISTRITOS)]
        email = f"{sin_tildes(nombre)}.{sin_tildes(apellido)}@{DOMINIO_PRUEBA}"
        existente = Usuario.query.filter_by(email=email).first()  # quedan de una carga anterior (limpiar_datos_prueba.py conserva usuarios)
        if existente:
            clientes.append(existente)
            continue
        cliente = Usuario(
            nombre=nombre, apellido=apellido, email=email,
            telefono=f"9{rng.randint(10000000, 99999999)}", tipo_documento="dni", numero_documento=f"9900{i + 1:04d}",
            direccion=f"Jr. Real {rng.randint(100, 999)}", distrito_id=distrito_id,
        )
        db.session.add(cliente)
        clientes.append(cliente)
    db.session.flush()
    return clientes


# ---------------------------------------------------------------------------
# Pedidos
# ---------------------------------------------------------------------------
def planear_pedidos(ahora, productos):
    """Decide QUÉ se vende y CUÁNDO (todavía sin tocar la base)."""
    pesos = [d["peso"] for d, _ in productos]
    por_mes = [14, 19, 24, 31, 38, 44]  # tendencia creciente: el gráfico de 6 meses sube
    specs = []
    for k, cantidad in enumerate(por_mes):
        inicio = meses_atras(ahora, 5 - k)
        fin = meses_atras(ahora, 4 - k) if k < 5 else ahora
        for _ in range(cantidad):
            specs.append({"creado": fecha_al_azar(inicio, min(fin, ahora)), "plan": None})
    for _ in range(12):  # un par de días movidos: da pedidos recientes para pendientes, pagos por revisar y recojos
        specs.append({"creado": fecha_al_azar(ahora - timedelta(hours=60), ahora - timedelta(minutes=15)), "plan": None})
    specs.sort(key=lambda s: s["creado"])

    for n, spec in enumerate(specs, start=1):
        spec["n"] = n
        spec["origen"] = "presencial" if rng.random() < 0.2 else "online"
        spec["tipo_entrega"] = "recojo" if spec["origen"] == "presencial" or rng.random() < 0.12 else "delivery"
        spec["metodo"] = (rng.choices(["efectivo", "yape", "tarjeta"], [5, 3, 2])[0] if spec["origen"] == "presencial"
                          else rng.choice(["yape", "tarjeta"]))
        items = []
        for _ in range(rng.choices([1, 2, 3], [60, 30, 10])[0]):
            datos, producto = rng.choices(productos, pesos)[0]
            if producto.id not in [i[0].id for i in items]:
                items.append((producto, rng.choice(producto.variantes), rng.choices([1, 2], [80, 20])[0]))
        spec["items"] = items

    edad = lambda s: (ahora - s["creado"]).total_seconds() / 3600
    online = [s for s in specs if s["origen"] == "online"]
    recientes = [s for s in online if edad(s) < 70]
    viejos = [s for s in online if edad(s) > 72]
    rng.shuffle(recientes)
    rng.shuffle(viejos)

    for s in recientes[:8]:
        s["plan"] = "en_revision"
    for s in recientes[8:11]:
        s["tipo_entrega"] = "recojo"
        s["plan"] = "listo_recojo" if s is not recientes[10] else None
    cola = [p for p in viejos if edad(p) > 72]
    for plan, cuantos in (("vencimiento_pago", 5), ("cliente", 4), ("sin_stock", 2), ("rechazado", 3)):
        for s in cola[:cuantos]:
            s["plan"] = plan
        cola = cola[cuantos:]
    reembolso = [s for s in cola if edad(s) < 240][:1]
    for s in reembolso:
        s["plan"] = "reembolso"
    return specs


def construir_pedido(spec, ahora, clientes, admin_id):
    """Devuelve (pedido, historial, intentos, eventos_stock) de una spec."""
    n, creado, plan = spec["n"], spec["creado"], spec["plan"]
    online = spec["origen"] == "online"
    delivery = spec["tipo_entrega"] == "delivery"
    cliente = rng.choice(clientes) if online else None
    subtotal = round(sum(float(p.precio_final) * c for p, _, c in spec["items"]), 2)
    costo_envio = 10.0 if (online and delivery) else 0.0
    distrito_id, distrito = rng.choice(DISTRITOS)

    pedido = Pedido(
        numero_pedido=f"ANS-{creado:%Y%m%d}-S{n:05d}", usuario_id=cliente.id if cliente else None,
        estado="pendiente", estado_pago="pendiente", metodo_pago=spec["metodo"], tipo_entrega=spec["tipo_entrega"],
        origen=spec["origen"], subtotal=subtotal, costo_envio=costo_envio, total=round(subtotal + costo_envio, 2),
        fecha_creacion=creado,
    )
    if cliente:
        pedido.envio_nombre = cliente.nombre_completo
        pedido.envio_tipo_documento, pedido.envio_numero_documento = "dni", cliente.numero_documento
        pedido.envio_telefono, pedido.envio_email = cliente.telefono, cliente.email
        if delivery:
            pedido.envio_direccion, pedido.envio_distrito = cliente.direccion, distrito
            pedido.envio_provincia, pedido.envio_dpto, pedido.distrito_id = "Huancayo", "Junín", distrito_id
    else:
        pedido.envio_nombre = f"{rng.choice(NOMBRES)} {rng.choice(APELLIDOS)}"

    historial, intentos = [], []
    cancelacion = None  # fecha en que se devolvió el stock, si se canceló

    def paso(anterior, nuevo, cuando):
        historial.append(HistorialEstadoPedido(
            estado_anterior=anterior, estado_nuevo=nuevo, fecha_creacion=cuando, cambiado_por=admin_id,
        ))
        return nuevo

    def cobrar(cuando):
        pedido.estado_pago, pedido.fecha_pago = "verificado", cuando
        pedido.culqi_cargo_id = f"chr_test_seed_{n:05d}"
        intentos.append(IntentoPago(monto=pedido.total, estado="aprobado", codigo_culqi=pedido.culqi_cargo_id, fecha_creacion=cuando))

    if not online:  # venta en tienda: pago al instante, igual que venta_presencial()
        pedido.estado, pedido.estado_pago, pedido.fecha_pago = "confirmado", "verificado", creado
    elif plan == "en_revision":
        pedido.estado_pago, pedido.metodo_pago = "en_revision", "yape"
    elif plan in ("vencimiento_pago", "cliente", "sin_stock"):
        cancelacion = creado + (horas(0.4) if plan == "vencimiento_pago" else horas(rng.uniform(1, 6)))
        pedido.fecha_limite_pago = creado + timedelta(minutes=20)
        pedido.estado, pedido.motivo_cancelacion = paso("pendiente", "cancelado", cancelacion), plan
    elif plan == "rechazado":
        cancelacion = creado + horas(0.5)
        pedido.estado_pago, pedido.motivo_cancelacion = "rechazado", "pago_rechazado"
        intentos.append(IntentoPago(monto=pedido.total, estado="rechazado", motivo_rechazo=rng.choice(MOTIVOS_RECHAZO), fecha_creacion=creado + timedelta(minutes=2)))
        pedido.estado = paso("pendiente", "cancelado", cancelacion)
    else:
        if rng.random() < 0.1:  # a veces el primer intento de pago falla
            intentos.append(IntentoPago(monto=pedido.total, estado="rechazado", motivo_rechazo=rng.choice(MOTIVOS_RECHAZO), fecha_creacion=creado + timedelta(minutes=1)))
        pago = min(creado + timedelta(minutes=rng.randint(3, 40)), ahora - timedelta(minutes=1))
        cobrar(pago)
        if plan == "reembolso":
            pedido.estado = paso("pendiente", "confirmado", pago)
            cancelacion = pago + horas(rng.uniform(3, 20))
            pedido.estado = paso("confirmado", "cancelado", cancelacion)
            pedido.estado_pago, pedido.motivo_cancelacion = "reembolso_pendiente", "cliente"
        else:
            etapas = [("confirmado", pago)]
            t = pago + horas(rng.uniform(2, 12))
            etapas.append(("preparando", t))
            if delivery:
                t += horas(rng.uniform(6, 30))
                etapas.append(("enviado", t))
                t += horas(rng.uniform(24, 72))
            else:
                t += horas(rng.uniform(3, 20))
                etapas.append(("listo_recojo", t))
                t += horas(rng.uniform(2, 48))
            etapas.append(("entregado", t))
            if plan == "listo_recojo":  # que se vea en "Recojos en tienda" hoy
                etapas = [("confirmado", pago), ("preparando", pago + horas(1)), ("listo_recojo", pago + horas(2))]
            anterior = "pendiente"
            for nuevo, cuando in etapas:
                if cuando > ahora:
                    break
                anterior = paso(anterior, nuevo, cuando)
                if nuevo == "entregado":
                    pedido.fecha_entregado = cuando
            pedido.estado = anterior
            if pedido.estado == "listo_recojo":
                pedido.codigo_recojo = Pedido.generar_codigo_recojo()
    return pedido, historial, intentos, cancelacion


# ---------------------------------------------------------------------------
# Programa principal
# ---------------------------------------------------------------------------
def seed(argumentos):
    with app.app_context():
        ahora = datetime.utcnow().replace(microsecond=0)
        rol_admin = Rol.query.filter(Rol.codigo.in_(("superadmin", "administrativo"))).first()
        admin = Usuario.query.filter_by(rol_id=rol_admin.id).first() if rol_admin else None
        admin_id = admin.id if admin else None
        try:
            proveedores, productos = crear_catalogo()
            clientes = crear_clientes()
            specs = planear_pedidos(ahora, productos)

            # --- 1) Cuánto stock hace falta comprar para que todo cuadre ---------------------
            # Los pedidos se arman primero (sin guardar) para saber cuándo se cancela cada uno:
            # al cancelar, el stock sale y luego vuelve, y en ese intervalo no puede quedar negativo.
            construidos = [(spec, *construir_pedido(spec, ahora, clientes, admin_id)) for spec in specs]
            primera_compra = specs[0]["creado"] - timedelta(days=7)
            fecha_restock = ahora - timedelta(days=40)
            fecha_merma = ahora - timedelta(days=12)
            mermas = {}
            movibles = [v for d, p in productos if d["stock"] > 6 for v in p.variantes]
            for variante in rng.sample(movibles, 3):
                mermas[variante.id] = 1
            restock = {}
            for datos, producto in productos:
                if datos["restock"]:
                    for variante in producto.variantes:
                        restock[variante.id] = min(4, variante.stock)

            previstos = {}  # variante_id -> [(fecha, cambio de stock)] sin contar la compra inicial
            for spec, _, _, _, cancelacion in construidos:
                for _, variante, cantidad in spec["items"]:
                    previstos.setdefault(variante.id, []).append((spec["creado"], -cantidad))
                    if cancelacion:
                        previstos[variante.id].append((cancelacion, cantidad))
            for variante_id, unidades in mermas.items():
                previstos.setdefault(variante_id, []).append((fecha_merma, -unidades))
            for variante_id, unidades in restock.items():
                previstos.setdefault(variante_id, []).append((fecha_restock, unidades))

            compra_inicial, correccion = {}, {}
            for datos, producto in productos:
                for variante in producto.variantes:
                    cambios = sorted(previstos.get(variante.id, []))
                    inicial = variante.stock - sum(c for _, c in cambios)  # para terminar justo en el stock planeado
                    acumulado = peor = 0
                    for _, cambio in cambios:
                        acumulado += cambio
                        peor = min(peor, acumulado)
                    falta = max(0, -peor - inicial)  # lo que habría que tener de más al inicio
                    compra_inicial[variante.id] = inicial + falta
                    correccion[variante.id] = falta  # se descuenta al final como "corrección por inventario"

            compras = []  # (compra, [(variante, cantidad, costo)])
            for indice, proveedor in enumerate(proveedores):
                for fecha, es_restock in ((primera_compra, False), (fecha_restock, True)):
                    lineas = []
                    for datos, producto in productos:
                        if datos["prov"] != indice:
                            continue
                        for variante in producto.variantes:
                            cantidad = restock.get(variante.id, 0) if es_restock else compra_inicial[variante.id]
                            if cantidad > 0:
                                lineas.append((producto, variante, cantidad, round(float(producto.precio) * 0.5, 2)))
                    if lineas:
                        total = round(sum(c * costo for _, _, c, costo in lineas), 2)
                        compra = Compra(
                            proveedor_id=proveedor.id, tipo_documento="factura", numero_documento=f"F001-{900 + len(compras)}",
                            fecha_compra=fecha.date(), estado="recibida", total=total, usuario_id=admin_id,
                            notas="Compra de prueba (seed.py)", fecha_creacion=fecha,
                        )
                        db.session.add(compra)
                        compras.append((compra, fecha, lineas))
            db.session.flush()
            for compra, _, lineas in compras:
                for producto, variante, cantidad, costo in lineas:
                    db.session.add(DetalleCompra(
                        compra_id=compra.id, producto_id=producto.id, variante_id=variante.id, talla=variante.talla,
                        color=variante.color, cantidad=cantidad, costo_unitario=costo, subtotal=round(cantidad * costo, 2),
                    ))

            # --- 2) Pedidos con su historial, pagos y detalle --------------------------------
            eventos = {}  # variante_id -> [(fecha, orden, dict)]

            def evento(variante, fecha, orden, **datos):
                eventos.setdefault(variante.id, []).append((fecha, orden, datos))

            for compra, fecha, lineas in compras:
                for producto, variante, cantidad, costo in lineas:
                    evento(variante, fecha, 0, tipo="ingreso_compra", delta=cantidad, producto=producto, costo_unitario=costo,
                           compra_id=compra.id, proveedor_id=compra.proveedor_id, motivo=f"Compra {compra.numero_documento}")
            for variante_id, unidades in mermas.items():
                variante = next(v for _, p in productos for v in p.variantes if v.id == variante_id)
                producto = next(p for _, p in productos if variante in p.variantes)
                evento(variante, fecha_merma, 1, tipo="merma", delta=-unidades, producto=producto, motivo="Prenda dañada en almacén")

            for variante_id, unidades in correccion.items():
                if unidades:
                    variante = next(v for _, p in productos for v in p.variantes if v.id == variante_id)
                    producto = next(p for _, p in productos if variante in p.variantes)
                    evento(variante, ahora, 5, tipo="ajuste_manual", delta=-unidades, producto=producto, motivo="Corrección por inventario físico")

            pedidos = []
            for spec, pedido, historial, intentos, cancelacion in construidos:
                db.session.add(pedido)
                db.session.flush()
                for h in historial:
                    h.pedido_id = pedido.id
                for i in intentos:
                    i.pedido_id = pedido.id
                db.session.add_all(historial + intentos)
                for producto, variante, cantidad in spec["items"]:
                    db.session.add(DetallePedido(
                        pedido_id=pedido.id, producto_id=producto.id, variante_id=variante.id, cantidad=cantidad,
                        precio_unit=producto.precio_final, talla=variante.talla, color=variante.color,
                        subtotal=round(float(producto.precio_final) * cantidad, 2),
                    ))
                    motivo = "Venta en tienda" if spec["origen"] == "presencial" else "Venta en línea"
                    evento(variante, spec["creado"], 2, tipo="venta", delta=-cantidad, producto=producto, pedido_id=pedido.id, motivo=motivo)
                    if cancelacion:
                        evento(variante, cancelacion, 3, tipo="restauracion", delta=cantidad, producto=producto, pedido_id=pedido.id,
                               motivo="Pedido cancelado")
                pedidos.append((spec, pedido))

            # --- 3) Kardex: se recorre el tiempo variante por variante ------------------------
            for datos, producto in productos:
                for variante in producto.variantes:
                    stock = 0
                    for fecha, _, d in sorted(eventos.get(variante.id, []), key=lambda e: (e[0], e[1])):
                        antes, stock = stock, stock + d["delta"]
                        assert stock >= 0, f"stock negativo en {producto.sku} ({variante.talla}/{variante.color})"
                        db.session.add(MovimientoStock(
                            variante_id=variante.id, producto_id=producto.id, tipo=d["tipo"], cantidad=abs(d["delta"]) if d["tipo"] in ("venta", "restauracion") else d["delta"],
                            pedido_id=d.get("pedido_id"), fecha_creacion=fecha, usuario_id=admin_id, motivo=d.get("motivo"),
                            stock_antes=antes, stock_despues=stock, costo_unitario=d.get("costo_unitario"),
                            proveedor_id=d.get("proveedor_id"), compra_id=d.get("compra_id"),
                            talla=variante.talla, color=variante.color,
                        ))
                    assert stock == variante.stock, f"el kardex no cuadra en {producto.sku}: {stock} != {variante.stock}"

            # --- 4) Carritos, reseñas y reclamos ----------------------------------------------
            for cliente in rng.sample(clientes, 6):
                datos, producto = rng.choice([p for p in productos if p[0]["stock"] > 0])
                db.session.add(ItemCarrito(
                    usuario_id=cliente.id, variante_id=rng.choice(producto.variantes).id,
                    cantidad=1, fecha_creacion=ahora - timedelta(days=rng.randint(3, 9)),
                ))
            vistas = set()
            for spec, pedido in pedidos:
                if pedido.estado == "entregado" and pedido.usuario_id and len(vistas) < 20 and rng.random() < 0.35:
                    producto = spec["items"][0][0]
                    if (producto.id, pedido.usuario_id) not in vistas:
                        vistas.add((producto.id, pedido.usuario_id))
                        db.session.add(Resena(
                            producto_id=producto.id, usuario_id=pedido.usuario_id, calificacion=rng.choices([5, 4, 3], [60, 30, 10])[0],
                            comentario=rng.choice(COMENTARIOS), compra_verificada=True,
                            fecha_creacion=pedido.fecha_entregado + timedelta(days=rng.randint(1, 4)),
                        ))
            cliente = clientes[0]
            for codigo, tipo, estado, dias in (("LR-S0001", "reclamo", "pendiente", 3), ("LR-S0002", "queja", "respondido", 25)):
                registro = ahora - timedelta(days=dias)
                db.session.add(Reclamacion(
                    codigo=codigo, fecha_registro=registro, fecha_limite=(registro + timedelta(days=30)).date(),
                    consumidor_nombre=cliente.nombre_completo, consumidor_doc_tipo="DNI", consumidor_documento=cliente.numero_documento,
                    consumidor_domicilio=cliente.direccion, consumidor_telefono=cliente.telefono, consumidor_email=cliente.email,
                    bien_tipo="producto", bien_descripcion="Cartera Charol Rosa", monto_reclamado=99.90, tipo=tipo,
                    detalle="El producto llegó con un detalle en el acabado." if tipo == "reclamo" else "La atención por WhatsApp tardó demasiado.",
                    pedido_consumidor="Solicito el cambio del producto." if tipo == "reclamo" else "Solicito mejorar la atención.",
                    estado=estado, respuesta=None if estado == "pendiente" else "Gracias por avisarnos, ya coordinamos el cambio.",
                    fecha_respuesta=None if estado == "pendiente" else registro + timedelta(days=2), respondido_por=None if estado == "pendiente" else admin_id,
                ))
            db.session.flush()

            # --- 5) Analítica: visitas, embudo y latencia (en bloque, son miles de filas) -----
            eventos_web, sesion = [], 0

            def vista(tipo, cuando, producto_id=None, usuario_id=None):
                eventos_web.append({"tipo_evento": tipo, "sesion_id": f"seed-{sesion}", "producto_id": producto_id,
                                    "usuario_id": usuario_id, "creado_en": cuando})

            inicio_hoy = datetime(ahora.year, ahora.month, ahora.day)
            for dias in range(6, -1, -1):
                dia = inicio_hoy - timedelta(days=dias)
                tope = ahora if dias == 0 else dia + timedelta(days=1)
                visitantes = rng.randint(70, 130) if dias else rng.randint(40, 70)
                for _ in range(visitantes):
                    sesion += 1
                    for _ in range(rng.choices([1, 2, 3, 4], [40, 30, 20, 10])[0]):
                        vista("vista_pagina", fecha_al_azar(dia, tope))
            ids_producto = [p.id for _, p in productos]
            compras_30d = sum(1 for s, p in pedidos if s["origen"] == "online" and p.estado_pago == "verificado" and (ahora - s["creado"]).days < 30)
            embudo = [("vista_producto", 1400), ("agregar_carrito", 360), ("inicio_checkout", max(150, compras_30d * 3)), ("compra_completada", compras_30d)]
            for tipo, cantidad in embudo:
                for _ in range(cantidad):
                    sesion += 1
                    vista(tipo, fecha_al_azar(ahora - timedelta(days=30), ahora), producto_id=rng.choice(ids_producto) if tipo != "inicio_checkout" else None)
            db.session.bulk_insert_mappings(EventoAnalitica, eventos_web)

            latencias = []
            for _ in range(420):
                mala = rng.random()
                latencias.append({
                    "endpoint": rng.choice(ENDPOINTS), "metodo": rng.choices(["GET", "POST"], [85, 15])[0],
                    "latencia_ms": int(rng.lognormvariate(4.9, 0.55)), "fecha_creacion": fecha_al_azar(ahora - horas(24), ahora),
                    "status_code": 500 if mala < 0.015 else 404 if mala < 0.05 else 200,
                })
            db.session.bulk_insert_mappings(LatenciaRequest, latencias)

            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        entregados = sum(1 for _, p in pedidos if p.estado == "entregado")
        print(f"\n✅ Datos de prueba creados:")
        print(f"   {len(productos)} productos · {len(proveedores)} proveedores · {len(clientes)} clientes · {len(compras)} compras")
        print(f"   {len(pedidos)} pedidos ({entregados} entregados) · {len(eventos_web)} eventos de visitas · {len(latencias)} registros de latencia")
        print("   Entra al panel > Dashboard para ver los gráficos. Para borrar todo: python limpiar_datos_prueba.py")


if __name__ == "__main__":
    argumentos = sys.argv[1:]
    if conectar_y_avisar(argumentos):
        seed(argumentos)
