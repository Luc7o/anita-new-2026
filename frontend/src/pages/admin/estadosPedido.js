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
    insignia: "bg-yellow-100 text-yellow-800",
    punto: "bg-yellow-400",
  },
  confirmado: {
    insignia: "bg-lime-100 text-lime-800",
    punto: "bg-lime-400",
  },
  preparando: {
    insignia: "bg-lime-200 text-lime-900",
    punto: "bg-lime-500",
  },
  listo_recojo: {
    insignia: "bg-emerald-100 text-emerald-800",
    punto: "bg-emerald-400",
  },
  enviado: {
    insignia: "bg-emerald-100 text-emerald-800",
    punto: "bg-emerald-400",
  },
  entregado: {
    insignia: "bg-exito-fuerte text-white",
    punto: "bg-exito-fuerte",
  },
  cancelado: {
    insignia: "bg-peligro/15 text-peligro",
    punto: "bg-peligro-fuerte",
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

// Colores del estado de pago, iguales en la lista y en el detalle del pedido.
// Lo que pide atención (por revisar, reembolso por hacer) va en ámbar de aviso.
export const ESTILO_ESTADO_PAGO = {
  pendiente: "bg-aviso/15 text-aviso",
  en_revision: "bg-aviso/15 text-aviso",
  verificado: "bg-exito/15 text-exito",
  rechazado: "bg-peligro/15 text-peligro",
  reembolso_pendiente: "bg-aviso/15 text-aviso",
  reembolsando: "bg-aviso/15 text-aviso",
  reembolsado: "bg-plum/10 text-plum-soft",
  no_aplica: "bg-plum/10 text-plum-soft",
};
