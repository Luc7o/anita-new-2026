import React from "react";

/** Ruedita para botones ocupados ("Guardando…"). Hereda el color del texto del botón. */
export default function Spinner({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-3px] ${className}`}
    />
  );
}
