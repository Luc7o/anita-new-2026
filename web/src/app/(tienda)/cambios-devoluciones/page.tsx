import type { Metadata } from "next";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { BotonesContacto } from "@/componentes/info/BotonesContacto";

export const metadata: Metadata = { title: "Cambios y devoluciones", description: "Cómo cambiar o devolver una prenda, plazos y condiciones." };
export const revalidate = 300;

export default async function CambiosDevoluciones() {
  return (
    <PaginaInfo
      titulo="Cambios y Devoluciones"
      volver="/tienda"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> queremos que estés completamente satisfecha con tu compra.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Plazo de cambio</h3>
              <p className="mt-1 text-sm text-plum-soft">Hasta 30 días después de la compra. Producto sin uso, con etiquetas y en su empaque original.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Devoluciones</h3>
              <p className="mt-1 text-sm text-plum-soft">Por defectos de fábrica o productos incorrectos. Reembolso del 100% del valor.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">¿Cómo solicitar un cambio?</p>
            <p className="text-sm text-plum-soft mt-1 mb-3">Escríbenos con tu número de pedido y el motivo del cambio.</p>
            <BotonesContacto
              mensaje="Hola, quiero solicitar un cambio o devolución. Mi número de pedido es: "
              asunto="Cambio o devolución"
            />
          </div>
        </div>
      </PaginaInfo>
  );
}