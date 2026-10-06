import React, { useEffect, useState } from "react";
import { urlVariante } from "../utils/imagenes.js";

// <img> que pide la versión liviana de la imagen (thumb / med / lg) en vez
// del original. Si esa versión no existe (imágenes subidas antes de la
// optimización y aún no migradas), vuelve sola al original.
//
// loading="lazy" hace que el navegador no descargue ni decodifique las
// imágenes que están fuera de pantalla; decoding="async" evita que la
// decodificación bloquee el hilo principal.
export default function ImagenOptimizada({
  src,
  variante = "thumb",
  alt = "",
  className = "",
  prioridad = false,
  ...resto
}) {
  const [usarOriginal, setUsarOriginal] = useState(false);

  useEffect(() => setUsarOriginal(false), [src]);

  return (
    <img
      src={usarOriginal ? src : urlVariante(src, variante)}
      alt={alt}
      className={className}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      onError={() => setUsarOriginal(true)}
      {...resto}
    />
  );
}
