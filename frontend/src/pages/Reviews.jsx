import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function Reviews() {
  return (
    <PaginaInfo
      titulo="Reviews de Clientes"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Esto es lo que nuestras clientas dicen sobre su experiencia en <strong className="text-plum">Anita New Style</strong>.
          </p>

          <div className="space-y-4">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-plum">María G.</h3>
                <span className="text-sm font-medium text-berry">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="mt-1 text-sm text-plum-soft">"Los productos son de excelente calidad y el servicio es muy rápido. Recibí mi pedido en perfectas condiciones. ¡Volveré a comprar!"</p>
              <p className="mt-2 text-xs text-plum-soft/70">Lima, 15 de agosto de 2026</p>
            </div>

            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-plum">Carlos R.</h3>
                <span className="text-sm font-medium text-berry">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="mt-1 text-sm text-plum-soft">"He comprado varias veces y siempre recibo mis pedidos a tiempo. La atención es excelente y las prendas son hermosas."</p>
              <p className="mt-2 text-xs text-plum-soft/70">Huancayo, 10 de agosto de 2026</p>
            </div>

            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-plum">Lucía F.</h3>
                <span className="text-sm font-medium text-berry">⭐⭐⭐⭐</span>
              </div>
              <p className="mt-1 text-sm text-plum-soft">"El personal es muy amable y resolvieron todas mis dudas sobre las tallas. La guía de tallas fue muy útil."</p>
              <p className="mt-2 text-xs text-plum-soft/70">Arequipa, 5 de agosto de 2026</p>
            </div>

            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-plum">Andrea M.</h3>
                <span className="text-sm font-medium text-berry">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="mt-1 text-sm text-plum-soft">"La tienda física es hermosa y el trato es muy cálido. Me encanta que tengan envíos a todo el Perú, así puedo comprar desde cualquier lugar."</p>
              <p className="mt-2 text-xs text-plum-soft/70">Huancayo, 1 de agosto de 2026</p>
            </div>
          </div>
        </div>
      }
    />
  );
}