"use client";

import { useEffect, useRef } from "react";

// Menú desplegable de la barra de filtros: un <details> nativo (funciona sin JavaScript) que
// además se cierra al hacer clic afuera, con Escape o al abrir otro menú. Al elegir una opción
// la página cambia de dirección y el menú sigue abierto, así se pueden marcar varias.
export function Desplegable({ titulo, activos = 0, alinear = "izquierda", children }: {
  titulo: React.ReactNode;
  /** Cuántas opciones hay marcadas (se muestra junto al título). */
  activos?: number;
  alinear?: "izquierda" | "derecha";
  children: React.ReactNode;
}) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const cerrarSiAfuera = (e: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false;
    };
    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !menu.current?.open) return;
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", cerrarSiAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarSiAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  return (
    <details ref={menu} name="filtros-tienda" className="group relative">
      <summary
        className={`flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors [&::-webkit-details-marker]:hidden ${
          activos ? "border-plum bg-plum text-ivory" : "border-plum/15 text-plum hover:border-plum"
        }`}
      >
        {titulo}
        {activos > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ivory px-1 text-[11px] font-bold text-plum">{activos}</span>}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div
        className={`absolute top-full z-30 mt-2 w-max min-w-52 max-w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-plum/10 bg-ivory p-2 shadow-[0_20px_40px_-20px_rgb(28_26_29/0.35)] ${
          alinear === "derecha" ? "right-0" : "left-0"
        }`}
      >
        {children}
      </div>
    </details>
  );
}
