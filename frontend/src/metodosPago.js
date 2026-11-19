// Única lista de los medios de pago que la tienda acepta HOY, para que la ficha de producto,
// la página "Formas de pago" y el checkout digan siempre lo mismo. Antes la ficha y "Formas
// de pago" ofrecían American Express, Plin y pago contraentrega, que el checkout no acepta:
// la clienta lo descubría recién al pagar.
//
// Si se habilita otra marca de tarjeta en Culqi, se agrega aquí y aparece en las tres vistas.
// Debe coincidir con Pedido.METODOS_PAGO_DISPONIBLES del backend (yape, tarjeta).
export const MARCAS_TARJETA = ["Visa", "Mastercard"];

export const METODOS_PAGO_TIENDA = [
  {
    id: "tarjeta",
    titulo: "Tarjetas de crédito/débito",
    resumen: `Tarjetas de crédito/débito (${MARCAS_TARJETA.join(", ")})`,
    detalle: `${MARCAS_TARJETA.join(" o ")}. El pago se procesa con Culqi: nunca guardamos tu número de tarjeta ni el CVV.`,
  },
  {
    id: "yape",
    titulo: "Yape",
    resumen: "Yape",
    detalle: "Pago inmediato desde tu celular con tu código de aprobación de Yape.",
  },
];
