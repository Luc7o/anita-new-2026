import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";
import useConfigTienda, { linkWhatsApp } from "../hooks/useConfigTienda.js";

function Tarjeta({ titulo, children, nota }) {
  return (
    <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
      <h3 className="font-semibold text-plum">{titulo}</h3>
      <div className="mt-1 text-sm text-plum-soft">{children}</div>
      {nota && <p className="text-xs text-plum-soft/70">{nota}</p>}
    </div>
  );
}

export default function Contacto() {
  const c = useConfigTienda();
  const wa = linkWhatsApp(c.whatsapp);
  const hayAlgo = c.correo_contacto || c.whatsapp || c.direccion || c.telefono;

  return (
    <PaginaInfo
      titulo="Contáctanos"
      volver="/"
      contenido={
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
                  {c.maps_url && (
                    <>
                      {" · "}
                      <a href={c.maps_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">Ver mapa</a>
                    </>
                  )}
                </Tarjeta>
              )}
              {c.telefono && <Tarjeta titulo="Teléfono">{c.telefono}</Tarjeta>}
            </div>
          )}

          {c.horario_atencion && (
            <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
              <p className="text-sm font-medium text-plum">Horario de atención</p>
              <p className="text-sm text-plum-soft">{c.horario_atencion}</p>
            </div>
          )}
        </div>
      }
    />
  );
}
