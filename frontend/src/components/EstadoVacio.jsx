import React from "react";
import { Link } from "react-router-dom";

/** Estado vacío amable: icono, mensaje corto y un camino claro para seguir. */
export default function EstadoVacio({ icono: Icono, titulo, texto, enlace, etiqueta, onClick, className = "" }) {
  return (
    <div className={`panel flex animate-fade-in flex-col items-center gap-3 p-10 text-center ${className}`}>
      {Icono && (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
          <Icono size={28} />
        </span>
      )}
      <h2 className="text-xl text-plum">{titulo}</h2>
      {texto && <p className="max-w-sm text-sm text-plum-soft">{texto}</p>}
      {enlace && (
        <Link to={enlace} onClick={onClick} className="btn-primary btn mt-2 !px-6">
          {etiqueta}
        </Link>
      )}
    </div>
  );
}
