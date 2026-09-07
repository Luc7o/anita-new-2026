// Número de WhatsApp de soporte, en formato internacional sin "+" ni
// espacios (como lo pide la URL de wa.me). Configurable por entorno para no
// dejarlo hardcodeado — ver .env.example.
const WHATSAPP_SOPORTE = import.meta.env.VITE_WHATSAPP_SOPORTE;

/**
 * Arma un link de wa.me con un mensaje pre-armado ya URL-encoded.
 * Devuelve null si no hay número configurado (VITE_WHATSAPP_SOPORTE vacío),
 * para que quien lo use pueda ocultar el botón en vez de mostrar un link
 * roto.
 */
export function armarLinkWhatsApp(mensaje) {
  if (!WHATSAPP_SOPORTE) return null;
  return `https://wa.me/${WHATSAPP_SOPORTE}?text=${encodeURIComponent(mensaje)}`;
}
