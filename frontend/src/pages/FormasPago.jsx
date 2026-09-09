import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function FormasPago() {
  return (
    <PaginaInfo
      titulo="Formas de Pago"
      volver="/tienda"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> ofrecemos múltiples opciones de pago para que elijas la que mejor se adapte a ti.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Tarjetas de crédito/débito</h3>
              <p className="mt-1 text-sm text-plum-soft">Visa, Mastercard, American Express. Pagos seguros con verificación.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Yape / Plin</h3>
              <p className="mt-1 text-sm text-plum-soft">Pago inmediato desde tu celular. Sin comisiones adicionales.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Transferencia bancaria</h3>
              <p className="mt-1 text-sm text-plum-soft">BCP, BBVA, Interbank. Recibirás nuestros datos al confirmar tu pedido.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Pago contraentrega</h3>
              <p className="mt-1 text-sm text-plum-soft">Disponible solo en Huancayo. Consulta disponibilidad antes de comprar.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">🔒 Compra segura</p>
            <p className="text-sm text-plum-soft">Todos los pagos son procesados de forma segura. No almacenamos tus datos bancarios.</p>
          </div>
        </div>
      }
    />
  );
}