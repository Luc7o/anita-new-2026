import React from "react";
import useConfigTienda from "../hooks/useConfigTienda.js";

/**
 * Logotipo de Anita New Style.
 * Si en Configuración se subió y guardó un logo, se muestra ese en TODOS los
 * lugares que usan este componente (cabecera, pie, panel de administración).
 * Si no hay logo guardado (o todavía está cargando), se muestra el logo oficial
 * de Anita New Style que viene con el proyecto.
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
  // Sin logo guardado en Configuración se usa el logo oficial incluido en el
  // proyecto (public/logo-anita-new-style.png), nunca un reemplazo.
  return (
    <img
      src="/logo-anita-new-style.png"
      alt={nombre_comercial || "Anita New Style"}
      className={`h-9 w-auto ${className}`}
    />
  );
}
