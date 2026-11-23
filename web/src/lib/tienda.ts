// Datos fijos de la tienda. Deben coincidir con el backend (es el que realmente cobra):
// COSTO_ENVIO_DELIVERY en backend/app/routes/pedidos.py.
export const COSTO_DELIVERY = 10;
export const MARCAS_TARJETA = ["Visa", "Mastercard"];

/** Enlace de wa.me con un mensaje ya armado, o null si no hay número configurado. */
export function enlaceWhatsApp(mensaje: string): string | null {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE;
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}

// Medios de pago que la tienda acepta HOY (= frontend/src/metodosPago.js y
// Pedido.METODOS_PAGO_DISPONIBLES del backend): ficha, "Formas de pago" y checkout dicen lo mismo.
export const METODOS_PAGO_TIENDA = [
  {
    id: "tarjeta",
    titulo: "Tarjetas de crédito/débito",
    detalle: `${MARCAS_TARJETA.join(" o ")}. El pago se procesa con Culqi: nunca guardamos tu número de tarjeta ni el CVV.`,
  },
  { id: "yape", titulo: "Yape", detalle: "Pago inmediato desde tu celular con tu código de aprobación de Yape." },
];
