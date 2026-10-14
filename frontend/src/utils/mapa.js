// Mapa de Google a partir de la dirección que escribió el admin. No necesita
// API key: usa el modo "output=embed" de maps.google.com.

function textoDireccion(direccion, ciudad) {
  return [direccion, ciudad, "Perú"].filter(Boolean).join(", ");
}

// URL para el <iframe>. Si el admin pegó un enlace de "Insertar un mapa"
// (google.com/maps/embed), se usa tal cual; si no, se arma con la dirección.
// Devuelve null si no hay dirección ni enlace embebible.
export function urlMapaEmbed({ direccion, ciudad, maps_url }) {
  if (/^https:\/\/www\.google\.com\/maps\/embed/i.test(maps_url || "")) return maps_url;
  if (!direccion) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(textoDireccion(direccion, ciudad))}&z=16&output=embed`;
}

// Enlace "Ver en Google Maps": el que puso el admin o, si no hay, uno armado
// con la dirección. Los enlaces /maps/embed no sirven para abrir en pestaña.
export function urlMapaEnlace({ direccion, ciudad, maps_url }) {
  if (maps_url && !/\/maps\/embed/i.test(maps_url)) return maps_url;
  if (!direccion) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoDireccion(direccion, ciudad))}`;
}
