import React from "react";

// Título grande de la pantalla: las palabras entran una a una con desenfoque y la
// última línea (en color de acento) entra letra por letra. Para lectores de pantalla
// es un solo texto: "antes destacado".
export default function TituloAnimado({ antes, destacado, className = "" }) {
  return (
    <h1 aria-label={`${antes} ${destacado}`} className={`adm-titulo ${className}`}>
      {antes.split(" ").map((palabra, i) => (
        <span key={i} aria-hidden="true" className="adm-w" style={{ animationDelay: `${i * 0.1}s` }}>
          {palabra}&nbsp;
        </span>
      ))}
      <em aria-hidden="true" className="block">
        {[...destacado].map((letra, i) => (
          <span key={i} className="adm-w" style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
            {letra === " " ? "\u00a0" : letra}
          </span>
        ))}
      </em>
    </h1>
  );
}
