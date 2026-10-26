export const ESTADOS_PEDIDO = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo_recojo: "Listo para recoger",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

// Colores por estado: una escala de avance, del amarillo (recién llegó) al
// verde (entregado), y rojo si se cancela.
//   pendiente -> confirmado -> preparando -> enviado / listo_recojo -> entregado
//   amarillo     lima           lima fuerte    esmeralda               verde
// Las clases van escritas completas (no armadas con template strings) para que
// Tailwind las detecte y no las elimine al compilar.
export const ESTILO_ESTADO_PEDIDO = {
  pendiente: {
    insignia: "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-300",
    punto: "bg-yellow-400",
  },
  confirmado: {
    insignia: "bg-lime-100 text-lime-800 ring-1 ring-inset ring-lime-300",
    punto: "bg-lime-400",
  },
  preparando: {
    insignia: "bg-lime-200 text-lime-900 ring-1 ring-inset ring-lime-400",
    punto: "bg-lime-500",
  },
  listo_recojo: {
    insignia: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300",
    punto: "bg-emerald-400",
  },
  enviado: {
    insignia: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300",
    punto: "bg-emerald-400",
  },
  entregado: {
    insignia: "bg-green-600 text-white ring-1 ring-inset ring-green-700",
    punto: "bg-green-600",
  },
  cancelado: {
    insignia: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-300",
    punto: "bg-red-500",
  },
};

export const ESTILO_ESTADO_DESCONOCIDO = {
  insignia: "bg-plum/10 text-plum-soft",
  punto: "bg-plum-soft",
};

// Cómo se entrega un pedido, para distinguirlos de un vistazo:
//  - delivery:  se envía a domicilio
//  - recojo:    compra por la web que el cliente retira en la tienda (pide código)
//  - mostrador: venta hecha en la tienda física, se entrega en el momento
export function tipoEntregaPedido(p) {
  if (p?.origen === "presencial") return "mostrador";
  return p?.tipo_entrega === "recojo" ? "recojo" : "delivery";
}

export const ENTREGAS_PEDIDO = {
  delivery: "Delivery",
  recojo: "Recojo en tienda",
  mostrador: "Venta en tienda",
};
