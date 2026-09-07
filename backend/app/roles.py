"""
Roles del sistema y qué grupos de roles pueden hacer qué.
Todo el control de permisos del backend se apoya en este archivo.
"""

SUPERADMIN = "superadmin"
ADMINISTRATIVO = "administrativo"
VENTAS = "ventas"
ALMACEN = "almacen"
RRHH = "rrhh"
CLIENTE = "cliente"
SOPORTE = "soporte"
AUDITOR = "auditor"
# "invitado" no se guarda en BD: es cualquiera que navega sin sesión.

ROLES = {
    SUPERADMIN: "Super administrador",
    ADMINISTRATIVO: "Administrativo",
    VENTAS: "Ventas",
    ALMACEN: "Almacén",
    RRHH: "RRHH",
    CLIENTE: "Cliente",
    SOPORTE: "Soporte",
    AUDITOR: "Auditor",
}

# Roles que tienen acceso al panel admin (aunque sea limitado)
ROLES_ADMIN = [SUPERADMIN, ADMINISTRATIVO, VENTAS, ALMACEN, RRHH, SOPORTE, AUDITOR]

# --- Productos y categorías ---
# Gestionar = crear/editar/eliminar producto, precio, categoría, etc.
PUEDE_GESTIONAR_PRODUCTOS = [SUPERADMIN, ADMINISTRATIVO]
# Almacén puede editar SOLO el stock (no precio, no datos del producto)
PUEDE_GESTIONAR_STOCK = [SUPERADMIN, ADMINISTRATIVO, ALMACEN]
# Ver = quien gestiona producto o stock, más ventas (para vender) y auditor/soporte (solo lectura)
PUEDE_VER_PRODUCTOS = PUEDE_GESTIONAR_STOCK + [VENTAS, SOPORTE, AUDITOR]

PUEDE_GESTIONAR_CATEGORIAS = [SUPERADMIN, ADMINISTRATIVO]
PUEDE_VER_CATEGORIAS = PUEDE_GESTIONAR_CATEGORIAS + [AUDITOR]

# --- Promociones ---
PUEDE_GESTIONAR_PROMOCIONES = [SUPERADMIN, ADMINISTRATIVO]
PUEDE_VER_PROMOCIONES = PUEDE_GESTIONAR_PROMOCIONES + [AUDITOR]

# --- Proveedores ---
PUEDE_GESTIONAR_PROVEEDORES = [SUPERADMIN, ADMINISTRATIVO, ALMACEN]
PUEDE_VER_PROVEEDORES = PUEDE_GESTIONAR_PROVEEDORES + [AUDITOR]

# --- Pedidos ---
# Cambiar estado del pedido (confirmar, preparar, marcar despachado, etc.)
PUEDE_GESTIONAR_PEDIDOS = [SUPERADMIN, VENTAS, ALMACEN]
# Ver pedidos (sin poder cambiarlos): administrativo, soporte y auditor
PUEDE_VER_PEDIDOS = PUEDE_GESTIONAR_PEDIDOS + [ADMINISTRATIVO, SOPORTE, AUDITOR]

# Cancelar pedido y marcar reembolso: exclusivo de ventas (movimiento de dinero + stock)
PUEDE_GESTIONAR_REEMBOLSOS = [SUPERADMIN, VENTAS]

# --- Venta presencial ---
PUEDE_REGISTRAR_VENTA = [SUPERADMIN, VENTAS]

# --- Reseñas ---
PUEDE_GESTIONAR_RESENAS = [SUPERADMIN, VENTAS, SOPORTE]
PUEDE_VER_RESENAS = PUEDE_GESTIONAR_RESENAS + [AUDITOR]

# --- Dashboard y reportes ---
# Dashboard general (ingresos, ventas): superadmin, administrativo, auditor
PUEDE_VER_DASHBOARD = [SUPERADMIN, ADMINISTRATIVO, AUDITOR]
# Dashboard de ventas propio (sin cifras financieras completas)
PUEDE_VER_DASHBOARD_VENTAS = [SUPERADMIN, ADMINISTRATIVO, VENTAS, AUDITOR]
# Dashboard de stock/almacén (sin cifras de ingresos)
PUEDE_VER_DASHBOARD_STOCK = [SUPERADMIN, ADMINISTRATIVO, ALMACEN, AUDITOR]

PUEDE_VER_REPORTES = [SUPERADMIN, ADMINISTRATIVO, VENTAS, ALMACEN, AUDITOR]

# --- Usuarios, roles y configuración ---
# Gestión de usuarios y roles: superadmin y RRHH
PUEDE_GESTIONAR_USUARIOS = [SUPERADMIN, RRHH]
PUEDE_VER_USUARIOS = PUEDE_GESTIONAR_USUARIOS + [AUDITOR]

# Configuración del sistema: exclusivo de superadmin (auditor solo puede ver)
PUEDE_GESTIONAR_CONFIGURACION = [SUPERADMIN]
PUEDE_VER_CONFIGURACION = PUEDE_GESTIONAR_CONFIGURACION + [AUDITOR]