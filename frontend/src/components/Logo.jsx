import React from "react";
import useConfigTienda from "../hooks/useConfigTienda.js";

/**
 * Logotipo de Anita New Style: imagen del logo + el nombre "ANITA NEW STYLE".
 * Si en Configuración se subió y guardó un logo, se muestra ese; si no hay (o
 * todavía está cargando), se usa el logo oficial que viene con el proyecto
 * (public/logo-anita-new-style.png). El nombre siempre va al lado.
 * tone="light" para fondos oscuros (cabecera, pie); "dark" para fondos claros.
 */
export default function Logo({ tone = "light", className = "", conNombre = true }) {
  const { logo_url, nombre_comercial } = useConfigTienda();
  const claro = tone === "light";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logo_url || "/logo-anita-new-style.png"}
        alt={conNombre ? "" : nombre_comercial || "Anita New Style"}
        aria-hidden={conNombre ? "true" : undefined}
        className="h-9 w-auto rounded-[6px]"
      />
      {conNombre && (
        <span
          className={`font-sans text-sm font-extrabold uppercase leading-none tracking-[0.12em] sm:text-base ${
            claro ? "text-white" : "text-plum"
          }`}
        >
          ANITA <span className={claro ? "text-berry-light" : "text-berry"}>NEW STYLE</span>
        </span>
      )}
    </span>
  );
}
