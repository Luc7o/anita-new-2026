import React from "react";

const PASOS = [
  { clave: "pendiente", label: "Pendiente" },
  { clave: "confirmado", label: "Confirmado" },
  { clave: "preparando", label: "Preparando" },
  { clave: "enviado", label: "Enviado" },
  { clave: "entregado", label: "Entregado" },
];

export default function SeguimientoPedido({ pedido }) {
  if (pedido.estado === "cancelado") {
    return (
      <div className="rounded-2xl bg-plum/5 p-4 text-center">
        <p className="font-medium text-plum-soft">Este pedido fue cancelado.</p>
      </div>
    );
  }

  const indiceActual = PASOS.findIndex((p) => p.clave === pedido.estado);

  return (
    <div>
      <div className="flex items-center">
        {PASOS.map((paso, i) => {
          const completado = i <= indiceActual;
          return (
            <React.Fragment key={paso.clave}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-glass ${
                    completado ? "bg-berry text-white" : "bg-white/70 text-plum-soft"
                  }`}
                >
                  {completado ? "✓" : i + 1}
                </div>
                <span
                  className={`w-16 text-center text-[11px] leading-tight ${
                    completado ? "font-semibold text-plum" : "text-plum-soft"
                  }`}
                >
                  {paso.label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className={`h-0.5 flex-1 ${i < indiceActual ? "bg-berry" : "bg-white/70"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {pedido.numero_seguimiento && (
        <div className="mt-4 rounded-2xl bg-white/50 p-3 text-sm text-plum-soft">
          <p>
            {pedido.empresa_envio && (
              <>
                Envío con <strong className="text-plum">{pedido.empresa_envio}</strong> ·{" "}
              </>
            )}
            N° de seguimiento: <strong className="text-plum">{pedido.numero_seguimiento}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
