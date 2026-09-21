import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function MetodosEnvio() {
  return (
    <PaginaInfo
      titulo="Métodos de Envío"
      volver="/tienda"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Recibe tus productos en la comodidad de tu hogar. Ofrecemos opciones rápidas y seguras para todo el Perú.
          </p>

          <div className="space-y-4">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Envío estándar</h3>
              <p className="mt-1 text-sm text-plum-soft">3 a 5 días hábiles para Lima y provincias. Seguimiento en línea.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Envío exprés</h3>
              <p className="mt-1 text-sm text-plum-soft">1 a 2 días hábiles. Disponible solo para Lima Metropolitana.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Recojo en tienda</h3>
              <p className="mt-1 text-sm text-plum-soft">Sin costo. Puedes recoger tu pedido en nuestra tienda física en Huancayo.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📦 Costos de envío</p>
            <p className="text-sm text-plum-soft">El costo del envío se calcula automáticamente al finalizar tu compra, según tu ubicación y el peso del pedido.</p>
          </div>
        </div>
      }
    />
  );
}