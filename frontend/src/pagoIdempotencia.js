// Clave de idempotencia del INTENTO DE PAGO (distinta de la clave de
// idempotencia del checkout, que solo cubre la creación del pedido).
//
// Se necesita porque cada vez que se abre el widget de Culqi se genera un
// token distinto, así que dos clics en "Pagar" para el MISMO pedido pueden
// mandar dos tokens diferentes al backend — la idempotencia del checkout no
// alcanza a cubrir eso. Esta clave se genera UNA vez por pedido (se guarda en
// sessionStorage con el id del pedido en la key) y se reutiliza en cualquier
// reintento de pago sobre ese mismo pedido, hasta que el pago quede
// verificado.
export function obtenerPagoIdempotencyKey(pedidoId) {
  const storageKey = `ans_pago_idempotency_key_${pedidoId}`;
  try {
    const existente = sessionStorage.getItem(storageKey);
    if (existente) return existente;
    const nueva = crypto.randomUUID();
    sessionStorage.setItem(storageKey, nueva);
    return nueva;
  } catch {
    // sessionStorage no disponible (modo privado, etc.): igual devolvemos
    // una clave, solo que no sobrevive a un reload ni sirve para detectar
    // un reintento en una pestaña nueva.
    return crypto.randomUUID();
  }
}

export function limpiarPagoIdempotencyKey(pedidoId) {
  try {
    sessionStorage.removeItem(`ans_pago_idempotency_key_${pedidoId}`);
  } catch {
    // no-op
  }
}
