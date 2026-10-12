import React, { useEffect, useRef, useState } from "react";
import { urlVariante } from "../utils/imagenes.js";

// <img> que pide la versión liviana de la imagen (thumb / med / lg) en vez
// del original. Si esa versión no existe (imágenes subidas antes de la
// optimización y aún no migradas), vuelve sola al original.
//
// loading="lazy" hace que el navegador no descargue ni decodifique las
// imágenes que están fuera de pantalla; decoding="async" evita que la
// decodificación bloquee el hilo principal.
//
// Mientras la imagen carga muestra el brillo de skeleton (como fondo del
// propio <img>, así no hace falta un contenedor extra) y, al terminar de
// cargar, aparece con un fundido suave.
export default function ImagenOptimizada({
  src,
  variante = "thumb",
  alt = "",
  className = "",
  prioridad = false,
  ...resto
}) {
  const [usarOriginal, setUsarOriginal] = useState(false);
  const [cargada, setCargada] = useState(false);
  const refImagen = useRef(null);

  useEffect(() => {
    setUsarOriginal(false);
    setCargada(false);
  }, [src]);

  // Si la imagen ya estaba en caché, el navegador puede haberla terminado
  // antes de que React enganchara onLoad.
  useEffect(() => {
    const el = refImagen.current;
    if (el && el.complete && el.naturalWidth > 0) setCargada(true);
  }, [src, usarOriginal]);

  const alFallar = () => {
    if (!usarOriginal) setUsarOriginal(true);
    else setCargada(true); // tampoco existe el original: dejamos de mostrar el brillo
  };

  return (
    <img
      ref={refImagen}
      src={usarOriginal ? src : urlVariante(src, variante)}
      alt={alt}
      className={`${className} ${cargada ? "animate-fade-in" : "skeleton"}`}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setCargada(true)}
      onError={alFallar}
      {...resto}
    />
  );
}
