import type { Metadata } from "next";
import { PaginaInfo, Tarjeta } from "@/componentes/info/PaginaInfo";
import { configTienda, linkWhatsApp } from "@/lib/configTienda";
import { urlMapaEnlace } from "@/lib/mapa";
import { MapaTienda } from "@/componentes/info/MapaTienda";

export const metadata: Metadata = { title: "Contacto", description: "Escríbenos por WhatsApp, correo o visítanos en nuestra tienda de Huancayo." };
export const revalidate = 300;

export default async function Contacto() {
  const c = await configTienda();
  const wa = linkWhatsApp(c.whatsapp);
  const hayAlgo = c.correo_contacto || c.whatsapp || c.direccion || c.telefono;

  return (
    <PaginaInfo
      titulo="Contáctanos"
      volver="/"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Estamos aquí para ayudarte. Elige el medio que prefieras y cuéntanos cómo podemos ayudarte.
          </p>

          {hayAlgo && (
            <div className="grid gap-4 sm:grid-cols-2">
              {c.correo_contacto && (
                <Tarjeta titulo="Correo electrónico">
                  <a href={`mailto:${c.correo_contacto}`} className="hover:underline">{c.correo_contacto}</a>
                </Tarjeta>
              )}
              {c.whatsapp && (
                <Tarjeta titulo="WhatsApp">
                  {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.whatsapp}</a> : c.whatsapp}
                </Tarjeta>
              )}
              {c.direccion && (
                <Tarjeta titulo="Tienda física" nota={c.referencia}>
                  {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ""}
                  {urlMapaEnlace(c) && (
                    <>
                      {" · "}
                      <a href={urlMapaEnlace(c) ?? undefined} target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">Ver mapa</a>
                    </>
                  )}
                </Tarjeta>
              )}
              {c.telefono && <Tarjeta titulo="Teléfono">{c.telefono}</Tarjeta>}
            </div>
          )}

          {c.direccion && <MapaTienda direccion={c.direccion} ciudad={c.ciudad} maps_url={c.maps_url} />}

          {c.horario_atencion && (
            <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
              <p className="text-sm font-medium text-plum">Horario de atención</p>
              <p className="text-sm text-plum-soft">{c.horario_atencion}</p>
            </div>
          )}
        </div>
      </PaginaInfo>
  );
}
