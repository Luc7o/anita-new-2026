import React from "react";
import { IconChevronLeft, IconChevronRight } from "./Icons.jsx";

// Paginador estilo Gmail: "1–10 de 118  ‹ ›"
// Props: pagina (1-based), porPagina, total, onCambiar(nuevaPagina), className
export default function Paginador({ pagina, porPagina, total, onCambiar, className = "" }) {
  if (!total) return null;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  const boton =
    "flex h-8 w-8 items-center justify-center rounded-full text-plum transition hover:bg-berry/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className={`flex items-center justify-end gap-2 text-xs text-plum-soft ${className}`}>
      <span aria-live="polite">
        {desde}–{hasta} de {total}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(Math.max(1, pagina - 1))}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        className={boton}
      >
        <IconChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina >= totalPaginas}
        aria-label="Página siguiente"
        className={boton}
      >
        <IconChevronRight size={16} />
      </button>
    </div>
  );
}
