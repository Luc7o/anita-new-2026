import React from "react";
import useConfigTienda from "../hooks/useConfigTienda.js";

/**
 * Logotipo de Anita New Style.
 * Si en Configuración se subió y guardó un logo, se muestra ese en TODOS los
 * lugares que usan este componente (cabecera, pie, panel de administración).
 * Si no hay logo (o todavía está cargando), se muestra el monograma "A" + nombre.
 * tone="light" para fondos oscuros (cabecera, pie); "dark" para fondos claros.
 */
export default function Logo({ tone = "light", className = "" }) {
  const { logo_url, nombre_comercial } = useConfigTienda();
  if (logo_url) {
    return (
      <img
        src={logo_url}
        alt={nombre_comercial || "Anita New Style"}
        className={`h-9 w-auto ${className}`}
      />
    );
  }
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
