import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";

export default function NuestrasTiendas() {
  const c = useConfigTienda();
  const hayContacto = c.correo_contacto || c.telefono;

  return (
    <PaginaInfo
      titulo="Nuestras Tiendas"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Actualmente tenemos una tienda física y estamos creciendo para llegar a más ciudades del Perú.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {(c.direccion || c.ciudad) && (
              <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
                <h3 className="font-semibold text-plum">📍 {c.ciudad ? `${c.ciudad} (Tienda principal)` : "Tienda principal"}</h3>
                {c.direccion && <p className="mt-1 text-sm text-plum-soft">{c.direccion}</p>}
                {c.referencia && <p className="text-sm text-plum-soft">{c.referencia}</p>}
                {c.horario_atencion && <p className="text-sm text-plum-soft">Horario: {c.horario_atencion}</p>}
                {c.telefono && <p className="text-sm text-plum-soft">Teléfono: {c.telefono}</p>}
                {c.maps_url && (
                  <a href={c.maps_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-berry hover:underline">
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

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
      }
    />
  );
}
