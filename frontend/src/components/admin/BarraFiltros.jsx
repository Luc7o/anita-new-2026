import React from "react";
import { IconSearch, IconClose } from "../Icons.jsx";

// Búsqueda y filtros con el MISMO aspecto en todas las pantallas del panel:
// buscador a la izquierda, filtros al lado y "Limpiar filtros" cuando hay alguno activo.

const claseControl =
  "rounded-[10px] bg-white text-sm text-plum ring-1 ring-plum/20 hover:ring-plum/40 focus:outline-none focus:ring-2 focus:ring-berry";

// Compara sin importar mayúsculas ni tildes; cada palabra escrita debe aparecer en algún campo.
const normalizar = (t) => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function coincide(busqueda, ...campos) {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = normalizar(campos.join(" "));
  return palabras.every((p) => texto.includes(p));
}

export function SelectFiltro({ etiqueta, value, onChange, children }) {
  return (
    <select aria-label={etiqueta} value={value} onChange={(e) => onChange(e.target.value)} className={`${claseControl} px-3 py-2`}>
      {children}
    </select>
  );
}

export function CampoFecha({ etiqueta, value, onChange, min, max }) {
  return (
    <label className="flex items-center gap-2 text-sm text-plum-soft">
      {etiqueta}
      <input
        type="date"
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${claseControl} px-3 py-1.5`}
      />
    </label>
  );
}

export default function BarraFiltros({ busqueda, onBusqueda, placeholder, hayFiltros, onLimpiar, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" role="search">
      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <IconSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-soft" />
        <input
          type="search"
          value={busqueda}
          maxLength={80}
          aria-label={placeholder}
          placeholder={placeholder}
          onChange={(e) => onBusqueda(e.target.value)}
          className={`${claseControl} w-full py-2 pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none`}
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => onBusqueda("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-plum-soft hover:text-berry"
          >
            <IconClose size={12} />
          </button>
        )}
      </div>
      {children}
      {hayFiltros && (
        <button type="button" onClick={onLimpiar} className="px-1 text-sm font-medium text-berry hover:underline">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
