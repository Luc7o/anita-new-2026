import React from "react";

// Etiqueta kraft colgante «Anita, elegida»: la etiqueta de TODA pieza en oferta.
// Cuelga recta de su hilo, con el precio de oferta grande y el anterior tachado.
// `chica` para las tarjetas de la vitrina. Estilos en theme.css (.colgante, .etiqueta-kraft).
export default function EtiquetaOferta({ precio, antes, chica = false, className = "" }) {
  return (
    <div className={`colgante ${chica ? "chico" : ""} ${className}`}>
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <path d="M15 0 C 15 10, 15 20, 15 30" stroke="#1c1a1d" strokeWidth="1.5" fill="none" />
      </svg>
      <div className={`etiqueta-kraft ${chica ? "chica" : ""}`}>
        <span className="que">Oferta</span>
        <span className="p">S/ {Number(precio).toFixed(2)}</span>
        <s>
          <span className="sr-only">Antes </span>S/ {Number(antes).toFixed(2)}
        </s>
      </div>
    </div>
  );
}
