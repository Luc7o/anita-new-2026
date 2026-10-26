import React from "react";
import { IconTruck, IconStore, IconBag } from "../Icons.jsx";
import {
  ESTILO_ESTADO_PEDIDO,
  ESTILO_ESTADO_DESCONOCIDO,
  ENTREGAS_PEDIDO,
  tipoEntregaPedido,
} from "../../pages/admin/estadosPedido.js";

// Etiqueta del estado del pedido, con el color de su etapa (ver estadosPedido.js).
export function InsigniaEstadoPedido({ estado, label, className = "" }) {
  const estilo = ESTILO_ESTADO_PEDIDO[estado] || ESTILO_ESTADO_DESCONOCIDO;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${estilo.insignia} ${className}`}
    >
      {label || estado}
    </span>
  );
}

const ESTILO_ENTREGA = {
  delivery: { clases: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-300", Icono: IconTruck },
  recojo: { clases: "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-300", Icono: IconStore },
  mostrador: { clases: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300", Icono: IconBag },
};

// Etiqueta de cómo se entrega el pedido: Delivery, Recojo en tienda o Venta en tienda.
export function InsigniaEntregaPedido({ pedido, className = "" }) {
  const tipo = tipoEntregaPedido(pedido);
  const { clases, Icono } = ESTILO_ENTREGA[tipo];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ${clases} ${className}`}
    >
      <Icono size={13} />
      {ENTREGAS_PEDIDO[tipo]}
    </span>
  );
}
