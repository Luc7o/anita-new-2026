// Modo de la app según VITE_APP_MODE (se define al construir, en Vercel):
//   - sin definir / "store": tienda pública (tudominio.com)
//   - "admin": panel de administración, pensado para admin.tudominio.com
export const IS_ADMIN_APP = import.meta.env.VITE_APP_MODE === "admin";

// En la app de admin las rutas cuelgan de "/" (admin.tudominio.com/pedidos).
// En la tienda, si no hay subdominio, siguen bajo "/admin" (tudominio.com/admin/pedidos).
export const ADMIN_BASE = IS_ADMIN_APP ? "" : "/admin";

// URL del panel en su propio dominio (opcional, solo en el build de la tienda).
// Si existe, el enlace "Panel admin" apunta allí y la tienda NO incluye el
// código del panel. Ej: https://admin.anita-new-style.xyz
export const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL || "").replace(/\/$/, "");

// URL de la tienda (opcional, solo en el build del admin) para el botón "Ver tienda".
export const TIENDA_URL = (import.meta.env.VITE_TIENDA_URL || "").replace(/\/$/, "");

// Arma una ruta del panel respetando el modo: rutaAdmin("/pedidos") ->
// "/admin/pedidos" en la tienda y "/pedidos" en el subdominio.
export const rutaAdmin = (ruta = "") => (ADMIN_BASE + ruta) || "/";
