import React from "react";

/**
 * Logotipo de Anita New Style: monograma "A" + nombre.
 * tone="light" para fondos oscuros (cabecera, pie); "dark" para fondos claros.
 */
export default function Logo({ tone = "light", className = "" }) {
  const claro = tone === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-berry font-display text-xl leading-none text-white"
      >
        A
      </span>
      <span className="font-display text-xl leading-none">
        <span className={claro ? "text-white" : "text-plum"}>Anita</span>{" "}
        <span className={claro ? "text-berry-light" : "text-berry"}>New Style</span>
      </span>
    </span>
  );
}
