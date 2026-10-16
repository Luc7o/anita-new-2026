import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Último logo conocido. Se recuerda entre una pantalla de carga y la siguiente
// para que, al navegar, no se vea un parpadeo de la "A" antes del logo real.
let ultimoLogo = "";

/**
 * Pantalla de espera mientras baja el código de una página (carga bajo demanda).
 * Antes era una caja vacía: con internet lento el cliente veía todo en blanco.
 * Muestra el logo que se subió en Configuración; si no hay, la "A" de siempre.
 */
export default function CargandoPagina() {
  const [logo, setLogo] = useState(ultimoLogo);

  useEffect(() => {
    let vivo = true;
    api
      .configuracionTienda()
      .then((c) => {
        ultimoLogo = c.logo_url || "";
        if (vivo) setLogo(ultimoLogo);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="animate-latido h-14 w-auto max-w-[12rem] rounded-[14px] object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="animate-latido flex h-12 w-12 items-center justify-center rounded-[14px] bg-berry font-display text-3xl leading-none text-white"
        >
          A
        </span>
      )}
      <span aria-hidden="true" className="block h-1 w-40 overflow-hidden rounded-full bg-plum/10">
        <span className="animate-barra block h-1 w-14 rounded-full bg-berry" />
      </span>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
