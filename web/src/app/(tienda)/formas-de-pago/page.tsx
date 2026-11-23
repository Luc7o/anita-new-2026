import type { Metadata } from "next";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { METODOS_PAGO_TIENDA } from "@/lib/tienda";

export const metadata: Metadata = { title: "Formas de pago", description: "Paga con tarjeta de crédito o débito, Yape o en efectivo al recoger en la tienda." };
export const revalidate = 300;

export default async function FormasPago() {
  return (
    <PaginaInfo
      titulo="Formas de Pago"
      volver="/tienda"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> puedes pagar tu compra en línea con:
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {METODOS_PAGO_TIENDA.map((m) => (
              <div key={m.id} className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
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
      </PaginaInfo>
  );
}