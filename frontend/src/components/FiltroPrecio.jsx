import React, { useEffect, useRef, useState } from "react";

// Campo de texto con prefijo "S/" para escribir el precio mínimo o máximo.
function CampoPrecio({ etiqueta, valor, onCambio, onBlur, onKeyDown }) {
  return (
    <label className="flex-1 text-[11px] text-plum-soft">
      {etiqueta}
      <span className="mt-0.5 flex items-center rounded-lg border border-plum/15 bg-white px-2 focus-within:border-berry/50">
        <span className="text-xs text-plum-soft">S/</span>
        <input
          inputMode="numeric"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent py-1.5 pl-1 text-sm text-plum focus:outline-none"
        />
      </span>
    </label>
  );
}

// Filtro de precio con dos formas de usarlo: arrastrar las dos perillas de la
// barra, o escribir el precio inicial y final. `desde`/`hasta` son null cuando
// no hay límite. Solo avisa (onCambio) al soltar la barra o al confirmar un
// número, así no se consulta la tienda en cada pixel que se arrastra.
export default function FiltroPrecio({ minimo, maximo, desde, hasta, onCambio }) {
  const [a, setA] = useState(desde ?? minimo);
  const [b, setB] = useState(hasta ?? maximo);
  const [textoA, setTextoA] = useState(String(desde ?? minimo));
  const [textoB, setTextoB] = useState(String(hasta ?? maximo));
  const valores = useRef({ a, b });

  // Si cambian desde afuera (limpiar filtros, otra búsqueda), se reflejan aquí.
  useEffect(() => {
    const na = desde ?? minimo;
    const nb = hasta ?? maximo;
    setA(na); setB(nb);
    setTextoA(String(na)); setTextoB(String(nb));
    valores.current = { a: na, b: nb };
  }, [desde, hasta, minimo, maximo]);

  if (!(maximo > minimo)) return null; // un solo precio en toda la tienda: no hay qué filtrar

  const fijar = (na, nb) => {
    valores.current = { a: na, b: nb };
    setA(na); setB(nb);
    setTextoA(String(na)); setTextoB(String(nb));
  };

  const confirmar = () => {
    const { a: x, b: y } = valores.current;
    onCambio(x <= minimo ? null : x, y >= maximo ? null : y);
  };

  const alArrastrarMin = (e) => fijar(Math.min(Number(e.target.value), valores.current.b), valores.current.b);
  const alArrastrarMax = (e) => fijar(valores.current.a, Math.max(Number(e.target.value), valores.current.a));

  // Número escrito a mano: se acomoda dentro del rango y en orden (inicial <= final).
  const confirmarTexto = () => {
    const limitar = (t, defecto) => {
      const n = Number(String(t).replace(",", "."));
      return Number.isFinite(n) && String(t).trim() !== "" ? Math.min(Math.max(Math.round(n), minimo), maximo) : defecto;
    };
    let x = limitar(textoA, minimo);
    let y = limitar(textoB, maximo);
    if (x > y) [x, y] = [y, x];
    fijar(x, y);
    confirmar();
  };
  const alTeclear = (e) => { if (e.key === "Enter") { e.preventDefault(); confirmarTexto(); } };

  const pct = (v) => ((v - minimo) / (maximo - minimo)) * 100;
  // Si las dos perillas quedan juntas al final, la de "inicial" debe quedar encima para poder moverla.
  const minEncima = a > (minimo + maximo) / 2;

  return (
    <div>
      <div className="rango-doble" style={{ "--ini": `${pct(a)}%`, "--fin": `${pct(b)}%` }}>
        <div className="rango-doble__pista" aria-hidden="true" />
        <input
          type="range"
          min={minimo} max={maximo} step={1} value={a}
          onChange={alArrastrarMin}
          onPointerUp={confirmar} onKeyUp={confirmar} onBlur={confirmar}
          aria-label="Precio mínimo"
          style={{ zIndex: minEncima ? 5 : 4 }}
        />
        <input
          type="range"
          min={minimo} max={maximo} step={1} value={b}
          onChange={alArrastrarMax}
          onPointerUp={confirmar} onKeyUp={confirmar} onBlur={confirmar}
          aria-label="Precio máximo"
          style={{ zIndex: minEncima ? 4 : 5 }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <CampoPrecio
          etiqueta="Desde"
          valor={textoA}
          onCambio={(v) => setTextoA(v.replace(/[^\d.,]/g, ""))}
          onBlur={confirmarTexto}
          onKeyDown={alTeclear}
        />
        <span className="mt-4 text-plum-soft">—</span>
        <CampoPrecio
          etiqueta="Hasta"
          valor={textoB}
          onCambio={(v) => setTextoB(v.replace(/[^\d.,]/g, ""))}
          onBlur={confirmarTexto}
          onKeyDown={alTeclear}
        />
      </div>
    </div>
  );
}
