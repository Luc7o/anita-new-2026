export const SUPERADMIN = "superadmin";
export const ADMINISTRATIVO = "administrativo";
export const VENTAS = "ventas";
export const ALMACEN = "almacen";
export const CAJERO = "cajero";

export const ROLES_ADMIN = [SUPERADMIN, ADMINISTRATIVO, VENTAS, ALMACEN, CAJERO];

export const PUEDE_GESTIONAR_STOCK = [SUPERADMIN, ADMINISTRATIVO, ALMACEN];
export const PUEDE_VER_PRODUCTOS = [...PUEDE_GESTIONAR_STOCK, VENTAS];

export const PUEDE_GESTIONAR_PRODUCTOS = [SUPERADMIN, ADMINISTRATIVO];

export const PUEDE_GESTIONAR_CATEGORIAS = [SUPERADMIN, ADMINISTRATIVO];

export const PUEDE_GESTIONAR_PROMOCIONES = [SUPERADMIN, ADMINISTRATIVO];
export const PUEDE_VER_PROMOCIONES = [...PUEDE_GESTIONAR_PROMOCIONES];

export const PUEDE_GESTIONAR_PROVEEDORES = [SUPERADMIN, ADMINISTRATIVO, ALMACEN];
export const PUEDE_VER_PROVEEDORES = [...PUEDE_GESTIONAR_PROVEEDORES];

export const PUEDE_GESTIONAR_PEDIDOS = [SUPERADMIN, VENTAS, ALMACEN];
export const PUEDE_VER_PEDIDOS = [...PUEDE_GESTIONAR_PEDIDOS, ADMINISTRATIVO];

// Cancelar pedido y marcar pago verificado/rechazado/reembolsado
export const PUEDE_GESTIONAR_REEMBOLSOS = [SUPERADMIN, VENTAS];

// Ventas presenciales: solo superadmin y cajero. El rol Ventas atiende únicamente las ventas en línea.
export const PUEDE_REGISTRAR_VENTA = [SUPERADMIN, CAJERO];

export const PUEDE_VER_DASHBOARD = [SUPERADMIN, ADMINISTRATIVO];
// Pestaña "Dashboard" del menú: todos los roles del panel menos el cajero
export const PUEDE_VER_INICIO = [SUPERADMIN, ADMINISTRATIVO, VENTAS, ALMACEN];

export const PUEDE_GESTIONAR_USUARIOS = [SUPERADMIN];

export const PUEDE_GESTIONAR_CONFIGURACION = [SUPERADMIN];
export const PUEDE_VER_CONFIGURACION = [...PUEDE_GESTIONAR_CONFIGURACION];

export const PUEDE_GESTIONAR_RECLAMACIONES = [SUPERADMIN, ADMINISTRATIVO];
export const PUEDE_VER_RECLAMACIONES = [...PUEDE_GESTIONAR_RECLAMACIONES];

// Recojos en tienda: la bandeja del cajero; el superadmin también puede usarla.
export const PUEDE_VER_RECOJOS = [SUPERADMIN, CAJERO];

// Reporte de ventas en PDF.
export const PUEDE_VER_REPORTES = [SUPERADMIN];
