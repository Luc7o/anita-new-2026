import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { configuracionTienda } from "@/db/schema";
import { URL_API } from "./sitio";

// Datos de la tienda que edita el admin (tabla configuracion_tienda), con los mismos
// nombres que GET /api/configuracion/tienda para que las páginas portadas de la SPA
// lean igual. Un dato vacío no se publica (no se inventa nada).
export type ConfigTienda = {
  nombre_comercial: string;
  correo_contacto: string;
  telefono: string;
  whatsapp: string;
  direccion: string;
  referencia: string;
  ciudad: string;
  horario_atencion: string;
  maps_url: string;
};

export const configTienda = cache(async (): Promise<ConfigTienda> => {
  const [c] = await db.select().from(configuracionTienda).limit(1);
  return {
    nombre_comercial: c?.nombreComercial || "Anita New Style",
    correo_contacto: c?.correoContacto || "",
    telefono: c?.telefono || "",
    whatsapp: c?.whatsapp || "",
    direccion: c?.direccion || "",
    referencia: c?.referencia || "",
    ciudad: c?.ciudad || "",
    horario_atencion: c?.horarioAtencion || "",
    maps_url: c?.mapsUrl || "",
  };
});

/** wa.me a partir del número del admin (9 dígitos = celular peruano sin 51). null si no sirve. */
export function linkWhatsApp(numero: string | null | undefined) {
  const digitos = (numero || "").replace(/\D/g, "");
  if (digitos.length === 9) return `https://wa.me/51${digitos}`;
  if (digitos.length >= 11) return `https://wa.me/${digitos}`;
  return null;
}

export type DatosProveedor = { razon_social?: string | null; ruc?: string | null; domicilio?: string | null };

/**
 * Razón social, RUC y domicilio del proveedor. Salen de las variables PROVEEDOR_* del
 * backend (las mismas de la hoja del Libro de Reclamaciones): una sola fuente.
 */
export const datosProveedor = cache(async (): Promise<DatosProveedor | null> => {
  try {
    const r = await fetch(`${URL_API}/reclamaciones/info`, { next: { revalidate: 3600 } });
    return r.ok ? ((await r.json()) as DatosProveedor) : null;
  } catch {
    return null;
  }
});
