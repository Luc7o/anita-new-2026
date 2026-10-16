import React from "react";
import { urlMapaEmbed } from "../utils/mapa.js";

// Mapa de Google incrustado. No se dibuja nada si no hay dirección.
export default function MapaTienda({ direccion, ciudad, maps_url, className = "" }) {
  const src = urlMapaEmbed({ direccion, ciudad, maps_url });
  if (!src) return null;
  return (
    <iframe
      key={src}
      title="Ubicación de la tienda en Google Maps"
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`h-64 w-full rounded-2xl border-0 shadow-glass ${className}`}
    />
  );
}
