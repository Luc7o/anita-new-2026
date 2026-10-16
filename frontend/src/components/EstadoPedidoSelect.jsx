import React, { useEffect, useRef, useState } from "react";

// Color del puntito de cada estado
const COLORES = {
  pendiente: "bg-amber-400",
  confirmado: "bg-sky-500",
  preparando: "bg-violet-500",
  enviado: "bg-indigo-500",
  entregado: "bg-emerald-500",
  cancelado: "bg-rose-500",
};

export default function EstadoPedidoSelect({ value, opciones, onChange, disabled }) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const contenedor = useRef(null);
  const lista = Object.entries(opciones);
  const actual = opciones[value] || value;

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  const abrir = () => {
    setActivo(Math.max(0, lista.findIndex(([v]) => v === value)));
    setAbierto(true);
  };

  const elegir = (v) => {
    setAbierto(false);
    if (v !== value) onChange(v);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!abierto) {
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape") setAbierto(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % lista.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i - 1 + lista.length) % lista.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      elegir(lista[activo][0]);
    }
  };

  return (
    <div ref={contenedor} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className="flex min-w-[10rem] items-center justify-between gap-3 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-plum shadow-glass ring-1 ring-berry/20 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-berry disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${COLORES[value] || "bg-plum-soft"}`} />
          {actual}
        </span>
        <svg
          className={`h-4 w-4 text-berry transition-transform ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-full min-w-[10rem] overflow-hidden rounded-2xl bg-white/95 p-1 shadow-xl ring-1 ring-black/5 backdrop-blur"
        >
          {lista.map(([v, label], i) => (
            <li
              key={v}
              role="option"
              aria-selected={v === value}
              onMouseEnter={() => setActivo(i)}
              onClick={() => elegir(v)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-plum ${
                i === activo ? "bg-berry/10" : ""
              } ${v === value ? "font-semibold" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${COLORES[v] || "bg-plum-soft"}`} />
                {label}
              </span>
              {v === value && <span className="text-berry">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
