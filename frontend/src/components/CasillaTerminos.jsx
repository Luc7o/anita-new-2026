import React from "react";
import { Link } from "react-router-dom";

/**
 * Casilla de aceptación de los Términos y Condiciones y la Política de Privacidad.
 * SIEMPRE empieza sin marcar (el estado lo lleva quien la usa) y los enlaces abren en
 * otra pestaña para no perder lo que la persona ya escribió en el formulario.
 */
export default function CasillaTerminos({ id = "acepta-terminos", checked, onChange, className = "" }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-2.5 text-xs text-plum-soft ${className}`}>
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-plum/30 accent-berry"
      />
      <span>
        He leído y acepto los{" "}
        <Link to="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">
          Términos y Condiciones
        </Link>{" "}
        y la{" "}
        <Link to="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">
          Política de Privacidad
        </Link>
        .
      </span>
    </label>
  );
}
