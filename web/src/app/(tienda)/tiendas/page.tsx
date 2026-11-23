import type { Metadata } from "next";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { configTienda } from "@/lib/configTienda";
import { urlMapaEnlace } from "@/lib/mapa";
import { MapaTienda } from "@/componentes/info/MapaTienda";

export const metadata: Metadata = { title: "Nuestras tiendas", description: "Dirección, horarios y cómo llegar a nuestra tienda en Huancayo." };
export const revalidate = 300;

export default async function NuestrasTiendas() {
  const c = await configTienda();
  const hayContacto = c.correo_contacto || c.telefono;

  return (
    <PaginaInfo
      titulo="Nuestras Tiendas"
      volver="/"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Actualmente tenemos una tienda física y estamos creciendo para llegar a más ciudades del Perú.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {(c.direccion || c.ciudad) && (
              <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
                <h3 className="font-semibold text-plum">{c.ciudad ? `${c.ciudad} (Tienda principal)` : "Tienda principal"}</h3>
                {c.direccion && <p className="mt-1 text-sm text-plum-soft">{c.direccion}</p>}
                {c.referencia && <p className="text-sm text-plum-soft">{c.referencia}</p>}
                {c.horario_atencion && <p className="text-sm text-plum-soft">Horario: {c.horario_atencion}</p>}
                {c.telefono && <p className="text-sm text-plum-soft">Teléfono: {c.telefono}</p>}
                {urlMapaEnlace(c) && (
                  <a href={urlMapaEnlace(c) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-berry hover:underline">
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {c.direccion && <MapaTienda direccion={c.direccion} ciudad={c.ciudad} maps_url={c.maps_url} className="h-72" />}

          {hayContacto && (
            <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
              <p className="text-sm font-medium text-plum">¿Dudas sobre nuestras tiendas?</p>
              <p className="text-sm text-plum-soft">
                {c.correo_contacto && <>Escríbenos a <strong>{c.correo_contacto}</strong></>}
                {c.correo_contacto && c.telefono && " o "}
                {c.telefono && <>llámanos al <strong>{c.telefono}</strong></>}.
              </p>
            </div>
          )}
        </div>
      </PaginaInfo>
  );
}
