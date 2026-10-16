import React from "react";

/**
 * Pantalla de espera mientras baja el código de una página (carga bajo demanda).
 * Antes era una caja vacía: con internet lento el cliente veía todo en blanco.
 */
export default function CargandoPagina() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5"
    >
      <span
        aria-hidden="true"
        className="animate-latido flex h-12 w-12 items-center justify-center rounded-[14px] bg-berry font-display text-3xl leading-none text-white"
      >
        A
      </span>
      <span aria-hidden="true" className="block h-1 w-40 overflow-hidden rounded-full bg-plum/10">
        <span className="animate-barra block h-1 w-14 rounded-full bg-berry" />
      </span>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
