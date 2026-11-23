export const MARCA = "Anita New Style";
export const DESCRIPCION =
  "Moda para toda la familia en Huancayo. Compra en línea con tarjeta o Yape, recojo en tienda o envío a domicilio.";
/** Dominio público de la tienda (para enlaces canónicos, sitemap y Open Graph). */
export const URL_TIENDA = (process.env.NEXT_PUBLIC_TIENDA_URL ?? "http://localhost:3000").replace(/\/$/, "");
/** API Flask (carrito, pedidos, cuenta) mientras dure la migración. */
export const URL_API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
