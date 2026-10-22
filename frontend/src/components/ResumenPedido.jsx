import React from "react";
import { soles } from "../formato.js";

// Líneas de productos de un pedido. `conVariantes` agrega talla y color (el panel
// admin los muestra; la vista del cliente no).
export function LineasPedido({ detalles, conVariantes = false, className = "" }) {
  return (
    <div className={`mt-6 space-y-2 ${className}`}>
      {detalles.map((d) => (
        <div key={d.id} className="flex justify-between text-sm text-plum-soft">
          <span>
            {d.cantidad}× {d.producto_nombre}
            {conVariantes && d.talla && ` · Talla ${d.talla}`}
            {conVariantes && d.color && ` · ${d.color}`}
          </span>
          <span>{soles(d.subtotal)}</span>
        </div>
      ))}
    </div>
  );
}

// Subtotal, envío y total de un pedido. `claseTotal` permite ajustar el estilo del total.
export function TotalesPedido({ pedido, claseTotal = "" }) {
  return (
    <div className="mt-4 space-y-1 border-t border-white/50 pt-4 text-sm text-plum-soft">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{soles(pedido.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Envío</span>
        <span>{soles(pedido.costo_envio)}</span>
      </div>
      <div className={`flex justify-between text-base font-semibold text-plum ${claseTotal}`}>
        <span>Total</span>
        <span>{soles(pedido.total)}</span>
      </div>
    </div>
  );
}
