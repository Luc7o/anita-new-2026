import React from "react";
import { IconStar } from "./Icons.jsx";

export default function Estrellas({ valor, onChange, size = 16 }) {
  const interactivo = typeof onChange === "function";
  const estrellas = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5 text-gold">
      {estrellas.map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactivo}
          onClick={() => onChange?.(n)}
          className={interactivo ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
        >
          <IconStar size={size} relleno={n <= Math.round(valor)} />
        </button>
      ))}
    </div>
  );
}
