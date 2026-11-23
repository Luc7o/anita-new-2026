// Mapa de Google a partir de la dirección del admin (sin API key: modo output=embed).
// Igual que frontend/src/utils/mapa.js.
type Lugar = { direccion?: string; ciudad?: string; maps_url?: string };

const texto = (direccion?: string, ciudad?: string) => [direccion, ciudad, "Perú"].filter(Boolean).join(", ");

/** URL para el <iframe>: el enlace "Insertar un mapa" del admin, o uno armado con la dirección. */
export function urlMapaEmbed({ direccion, ciudad, maps_url }: Lugar) {
  if (/^https:\/\/www\.google\.com\/maps\/embed/i.test(maps_url || "")) return maps_url!;
  if (!direccion) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(texto(direccion, ciudad))}&z=16&output=embed`;
}

/** Enlace "Ver en Google Maps" (los /maps/embed no sirven para abrir en pestaña). */
export function urlMapaEnlace({ direccion, ciudad, maps_url }: Lugar) {
  if (maps_url && !/\/maps\/embed/i.test(maps_url)) return maps_url;
  if (!direccion) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto(direccion, ciudad))}`;
}
