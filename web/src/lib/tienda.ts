// Datos fijos de la tienda. Deben coincidir con el backend (es el que realmente cobra):
// COSTO_ENVIO_DELIVERY en backend/app/routes/pedidos.py.
export const COSTO_DELIVERY = 10;
export const MARCAS_TARJETA = ["Visa", "Mastercard"];

/** Enlace de wa.me con un mensaje ya armado, o null si no hay número configurado. */
export function enlaceWhatsApp(mensaje: string): string | null {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE;
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}
