import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function CambiosDevoluciones() {
  return (
    <PaginaInfo
      titulo="Cambios y Devoluciones"
      volver="/tienda"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> queremos que estés completamente satisfecha con tu compra.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Plazo de cambio</h3>
              <p className="mt-1 text-sm text-plum-soft">Hasta 30 días después de la compra. Producto sin uso, con etiquetas y en su empaque original.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Devoluciones</h3>
              <p className="mt-1 text-sm text-plum-soft">Por defectos de fábrica o productos incorrectos. Reembolso del 100% del valor.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📌 ¿Cómo solicitar un cambio?</p>
            <p className="text-sm text-plum-soft mt-1">Escríbenos a <strong>contacto@anitanewstyle.com</strong> con tu número de pedido y el motivo del cambio. Te responderemos en menos de 24 horas.</p>
          </div>
        </div>
      }
    />
  );
}