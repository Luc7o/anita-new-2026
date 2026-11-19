import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";
import { METODOS_PAGO_TIENDA } from "../metodosPago.js";

export default function FormasPago() {
  return (
    <PaginaInfo
      titulo="Formas de Pago"
      volver="/tienda"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> puedes pagar tu compra en línea con:
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {METODOS_PAGO_TIENDA.map((m) => (
              <div key={m.id} className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
                <h3 className="font-semibold text-plum">{m.titulo}</h3>
                <p className="mt-1 text-sm text-plum-soft">{m.detalle}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">Compra segura</p>
            <p className="text-sm text-plum-soft">Todos los pagos son procesados de forma segura. No almacenamos tus datos bancarios.</p>
          </div>
        </div>
      }
    />
  );
}