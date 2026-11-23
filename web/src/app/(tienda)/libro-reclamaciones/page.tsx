import type { Metadata } from "next";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { datosProveedor } from "@/lib/configTienda";
import { FormReclamo } from "./FormReclamo";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Libro de Reclamaciones virtual de Anita New Style: registra un reclamo o una queja.",
};
export const revalidate = 3600;

function IconoLibro() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-berry">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

export default async function PaginaLibroReclamaciones() {
  const info = await datosProveedor();
  return (
    <PaginaInfo titulo="Libro de Reclamaciones">
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-berry/25 bg-berry/5 p-4">
          <IconoLibro />
          <div className="text-sm">
            <p className="font-semibold text-plum">Libro de Reclamaciones virtual</p>
            <p>
              Aquí puedes registrar un reclamo o una queja sobre nuestros productos o nuestra atención. Recibirás una copia de tu hoja y
              te responderemos en un plazo máximo de 15 días hábiles.
            </p>
          </div>
        </div>

        {info && (info.razon_social || info.ruc) && (
          <dl className="grid gap-x-6 gap-y-1 rounded-xl border border-plum/15 bg-white/50 p-4 text-sm sm:grid-cols-2">
            {info.razon_social && (
              <div>
                <dt className="inline font-semibold text-plum">Proveedor: </dt>
                <dd className="inline">{info.razon_social}</dd>
              </div>
            )}
            {info.ruc && (
              <div>
                <dt className="inline font-semibold text-plum">RUC: </dt>
                <dd className="inline">{info.ruc}</dd>
              </div>
            )}
            {info.domicilio && (
              <div className="sm:col-span-2">
                <dt className="inline font-semibold text-plum">Domicilio: </dt>
                <dd className="inline">{info.domicilio}</dd>
              </div>
            )}
          </dl>
        )}

        <FormReclamo />
      </div>
    </PaginaInfo>
  );
}
