// Reglas de precio y stock de un producto. Son las MISMAS que
// backend/app/models/producto.py (precio_final, tiene_oferta, descuento_porcentaje,
// sin_stock): mientras convivan las dos apps, cualquier cambio va en los dos lados.

export type Precios = {
  precio: number;
  precioOferta: number | null;
  precioFinal: number;
  tieneOferta: boolean;
  descuentoPorcentaje: number;
};

export function calcularPrecios(precioTexto: string, ofertaTexto: string | null): Precios {
  const precio = Number(precioTexto);
  const oferta = ofertaTexto != null ? Number(ofertaTexto) : null;
  // Como en Flask: una oferta de 0 se trata como "sin oferta".
  const precioOferta = oferta ? oferta : null;
  const tieneOferta = precioOferta !== null && precioOferta < precio;
  return {
    precio,
    precioOferta,
    precioFinal: precioOferta ?? precio,
    tieneOferta,
    descuentoPorcentaje: tieneOferta ? Math.round(((precio - precioOferta!) / precio) * 100) : 0,
  };
}

/** "S/ 45.00" */
export function soles(monto: number): string {
  return `S/ ${monto.toFixed(2)}`;
}

/** Igual que la tarjeta de la tienda: avisa "Quedan N" con 3 unidades o menos. */
export function quedanPocas(stock: number): boolean {
  return stock > 0 && stock <= 3;
}
