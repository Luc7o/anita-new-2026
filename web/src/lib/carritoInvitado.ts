// Carrito de invitado en el navegador (clave de siempre, ans_carrito_invitado). Nunca guarda precios: el servidor
// valida las líneas cada vez.
export type Linea = { key: string; producto_id: number; cantidad: number; talla: string | null; color: string | null };

export const CLAVE_CARRITO = "ans_carrito_invitado";

export function leerLineas(): Linea[] {
  try {
    const lineas = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? "[]");
    if (!Array.isArray(lineas)) return [];
    return lineas.filter((l) => l && typeof l.key === "string" && Number.isInteger(l.producto_id) && l.cantidad > 0);
  } catch {
    return [];
  }
}

export function guardarLineas(lineas: Linea[]) {
  try {
    if (lineas.length) localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
    else localStorage.removeItem(CLAVE_CARRITO);
  } catch {
    // modo privado estricto: el carrito vive solo en esta pestaña
  }
}

export const mismaLinea = (a: Pick<Linea, "producto_id" | "talla" | "color">, b: Pick<Linea, "producto_id" | "talla" | "color">) =>
  a.producto_id === b.producto_id && (a.talla ?? null) === (b.talla ?? null) && (a.color ?? null) === (b.color ?? null);
