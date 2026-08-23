export const ROLES_ADMIN = ["superadmin", "moderador", "editor", "soporte", "auditor"];

export const PUEDE_VER_PRODUCTOS = ["superadmin", "moderador", "editor", "auditor"];
export const PUEDE_VER_PEDIDOS = ["superadmin", "moderador", "soporte", "auditor"];
export const PUEDE_GESTIONAR_PEDIDOS = ["superadmin", "moderador", "soporte"];
export const PUEDE_VER_PROVEEDORES = ["superadmin", "editor", "moderador", "auditor"];
export const PUEDE_GESTIONAR_PROMOCIONES = ["superadmin", "moderador", "editor"];
export const PUEDE_VER_PROMOCIONES = ["superadmin", "moderador", "editor", "auditor"];
export const PUEDE_GESTIONAR_USUARIOS = ["superadmin"];
export const PUEDE_VER_DASHBOARD = ROLES_ADMIN;
