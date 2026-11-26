"use client";

import { useEffect, useRef, useState } from "react";

// Buscador de la cabecera en celular: una lupa que despliega la barra de búsqueda debajo de
// la cabecera. Desde sm en adelante se usa el buscador fijo de Cabecera.tsx.
export function BuscadorMovil() {
  const [abierto, setAbierto] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-controls="buscador-movil"
        aria-label={abierto ? "Cerrar buscador" : "Buscar productos"}
        className="grid h-10 w-10 place-items-center rounded-full text-plum hover:text-berry focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--c-focus))]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" className="h-[22px] w-[22px]">
          {abierto ? <path d="M6 6l12 12M18 6 6 18" /> : <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>}
        </svg>
      </button>

      <form
        id="buscador-movil"
        action="/tienda"
        role="search"
        hidden={!abierto}
        className="absolute inset-x-0 top-full border-b border-plum/10 bg-ivory px-4 py-3"
      >
        <label htmlFor="buscar-movil" className="sr-only">Buscar en la tienda</label>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-plum-soft"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          {/* text-base (16px) evita que iOS haga zoom al enfocar el campo. */}
          <input
            ref={campo}
            id="buscar-movil"
            name="q"
            type="search"
            placeholder="Buscar productos"
            className="h-11 w-full rounded-full border border-plum/15 bg-transparent pl-10 pr-4 text-base font-normal text-plum outline-none placeholder:text-plum-soft focus:border-berry"
          />
        </div>
      </form>
    </div>
  );
}
