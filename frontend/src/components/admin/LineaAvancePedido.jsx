import React from "react";

// Progreso del pedido en una línea: Pendiente -> Confirmado -> Preparando -> Enviado
// (o Listo para recoger si es recojo) -> Entregado.
export default function LineaAvancePedido({ pedido }) {
  const esRecojo = pedido.tipo_entrega === "recojo";
  const pasos = [
    ["pendiente", "Pendiente"],
    ["confirmado", "Confirmado"],
    ["preparando", "Preparando"],
    esRecojo ? ["listo_recojo", "Listo para recoger"] : ["enviado", "Enviado"],
    ["entregado", "Entregado"],
  ];
  const actual = pasos.findIndex(([clave]) => clave === pedido.estado);

  return (
    <ol className="flex" aria-label="Avance del pedido">
      {pasos.map(([clave, etiqueta], i) => {
        const hecho = i <= actual;
        return (
          <li key={clave} className="relative flex-1 pt-6 text-center text-xs" aria-current={i === actual ? "step" : undefined}>
            {i > 0 && (
              <span className={`absolute left-[-50%] top-[9px] h-0.5 w-full ${i <= actual ? "bg-berry" : "bg-plum/15"}`} aria-hidden="true" />
            )}
            <span
              className={`absolute left-1/2 top-[3px] z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4 ring-white ${hecho ? "bg-berry" : "bg-plum/20"}`}
              aria-hidden="true"
            />
            <span className={hecho ? "font-medium text-plum" : "text-plum-soft"}>{etiqueta}</span>
          </li>
        );
      })}
    </ol>
  );
}
