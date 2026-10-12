// Disponibilidad de tallas/colores de un producto a partir de su detalle
// completo (`api.producto(id)`, que trae `variantes` con el stock de cada
// combinación talla+color). Los listados (tarjetas) NO traen `variantes`.

const igual = (a, b) => (a || null) === (b || null);

// Stock de una combinación exacta. Si el producto no usa variantes, es su
// stock total sin importar lo elegido.
export function stockCombo(producto, talla, color) {
  if (!producto) return 0;
  if (!producto.usa_variantes) return producto.stock ?? 0;
  const tallaBuscada = producto.tallas?.length ? talla : null;
  const colorBuscado = producto.colores?.length ? color : null;
  const variante = (producto.variantes || []).find(
    (v) => igual(v.talla, tallaBuscada) && igual(v.color, colorBuscado)
  );
  return variante ? variante.stock : 0;
}

// Una talla se puede elegir si hay stock para ella. Si ya se eligió color,
// exige esa combinación exacta; si no, alcanza con que exista alguna
// variante con esa talla y stock (así nada queda bloqueado solo porque
// todavía falta elegir la otra opción).
export function tallaDisponible(producto, talla, color) {
  if (!producto?.usa_variantes) return true;
  if (color) return stockCombo(producto, talla, color) > 0;
  return (producto.variantes || []).some((v) => igual(v.talla, talla) && v.stock > 0);
}

export function colorDisponible(producto, color, talla) {
  if (!producto?.usa_variantes) return true;
  if (talla) return stockCombo(producto, talla, color) > 0;
  return (producto.variantes || []).some((v) => igual(v.color, color) && v.stock > 0);
}
