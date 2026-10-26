"""
Roles del sistema y qué grupos de roles pueden hacer qué.
Todo el control de permisos del backend se apoya en este archivo.
"""

SUPERADMIN = "superadmin"
ADMINISTRATIVO = "administrativo"
VENTAS = "ventas"
ALMACEN = "almacen"
CAJERO = "cajero"
CLIENTE = "cliente"
# "invitado" no se guarda en BD: es cualquiera que navega sin sesión.

ROLES = {
    SUPERADMIN: "Super administrador",
    ADMINISTRATIVO: "Administrativo",
    VENTAS: "Ventas",
    ALMACEN: "Almacén",
    CAJERO: "Cajero",
    CLIENTE: "Cliente",
}

# Roles que tienen acceso al panel admin (aunque sea limitado)
ROLES_ADMIN = [SUPERADMIN, ADMINISTRATIVO, VENTAS, ALMACEN, CAJERO]

# --- Productos y categorías ---
# Gestionar = crear/editar/eliminar producto, precio, categoría, etc.
PUEDE_GESTIONAR_PRODUCTOS = [SUPERADMIN, ADMINISTRATIVO]
# Almacén puede editar SOLO el stock (no precio, no datos del producto)
PUEDE_GESTIONAR_STOCK = [SUPERADMIN, ADMINISTRATIVO, ALMACEN]
# Ver = quien gestiona producto o stock, más ventas y cajero (para buscar al vender;
# el cajero solo consulta, el menú del panel no le muestra la sección Productos)
PUEDE_VER_PRODUCTOS = PUEDE_GESTIONAR_STOCK + [VENTAS, CAJERO]

PUEDE_GESTIONAR_CATEGORIAS = [SUPERADMIN, ADMINISTRATIVO]
# Listar categorías es solo lectura y lo necesita la pantalla de Productos (filtro y
# formulario), así que lo ve quien ve productos. Crear/editar/borrar sigue siendo
# solo de superadmin y administrativo.
PUEDE_VER_CATEGORIAS = PUEDE_VER_PRODUCTOS

# --- Promociones ---
PUEDE_GESTIONAR_PROMOCIONES = [SUPERADMIN, ADMINISTRATIVO]
PUEDE_VER_PROMOCIONES = PUEDE_GESTIONAR_PROMOCIONES

# --- Proveedores ---
PUEDE_GESTIONAR_PROVEEDORES = [SUPERADMIN, ADMINISTRATIVO, ALMACEN]
PUEDE_VER_PROVEEDORES = PUEDE_GESTIONAR_PROVEEDORES

# --- Pedidos ---
# Cambiar estado del pedido (confirmar, preparar, marcar despachado, etc.)
PUEDE_GESTIONAR_PEDIDOS = [SUPERADMIN, VENTAS, ALMACEN]
# Ver pedidos (sin poder cambiarlos): administrativo
PUEDE_VER_PEDIDOS = PUEDE_GESTIONAR_PEDIDOS + [ADMINISTRATIVO]
# Descargar la boleta de un pedido: quien ve pedidos, más el cajero (solo las de
# ventas en tienda; el endpoint lo restringe). El cajero no ve la lista de pedidos.
PUEDE_VER_BOLETA = PUEDE_VER_PEDIDOS + [CAJERO]

# Cancelar pedido y marcar reembolso: exclusivo de ventas (movimiento de dinero + stock)
PUEDE_GESTIONAR_REEMBOLSOS = [SUPERADMIN, VENTAS]

# --- Venta presencial ---
# Las ventas en tienda las registra el cajero (sin dashboard, reportes, cancelaciones ni
# reembolsos). El rol Ventas se encarga solo de las ventas en línea: no registra ventas presenciales.
PUEDE_REGISTRAR_VENTA = [SUPERADMIN, CAJERO]

# --- Dashboard y reportes ---
# Dashboard general (ingresos, ventas): superadmin y administrativo
PUEDE_VER_DASHBOARD = [SUPERADMIN, ADMINISTRATIVO]
# Dashboard de ventas propio (sin cifras financieras completas)
PUEDE_VER_DASHBOARD_VENTAS = [SUPERADMIN, ADMINISTRATIVO, VENTAS]
# Dashboard de stock/almacén (sin cifras de ingresos)
PUEDE_VER_DASHBOARD_STOCK = [SUPERADMIN, ADMINISTRATIVO, ALMACEN]


# --- Usuarios, roles y configuración ---
# Gestión de usuarios y roles: exclusivo de superadmin
PUEDE_GESTIONAR_USUARIOS = [SUPERADMIN]

# Configuración del sistema: exclusivo de superadmin
PUEDE_GESTIONAR_CONFIGURACION = [SUPERADMIN]
PUEDE_VER_CONFIGURACION = PUEDE_GESTIONAR_CONFIGURACION

# --- Libro de Reclamaciones ---
# Responder reclamos/quejas (plazo legal de 15 días hábiles): administración
PUEDE_GESTIONAR_RECLAMACIONES = [SUPERADMIN, ADMINISTRATIVO]
PUEDE_VER_RECLAMACIONES = PUEDE_GESTIONAR_RECLAMACIONES
