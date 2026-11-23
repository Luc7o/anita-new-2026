// Esta app es solo el panel de administración, con sus rutas desde "/"
// (admin.anita-new-style.xyz/pedidos). La tienda pública vive en web/ (Next.js).

// URL de la tienda (opcional) para el botón "Ver tienda". Ej: https://www.anita-new-style.xyz
export const TIENDA_URL = (import.meta.env.VITE_TIENDA_URL || "").replace(/\/$/, "");

// Ruta del panel: rutaAdmin("/pedidos") -> "/pedidos"; rutaAdmin() -> "/".
export const rutaAdmin = (ruta = "") => ruta || "/";
