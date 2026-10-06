import React, { useCallback, useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import { IconClose, IconChevronLeft, IconChevronRight } from "./Icons.jsx";

// Visor a pantalla completa de las fotos de un producto.
//
// Es el único lugar de la tienda que descarga la imagen en su resolución
// total, y solo cuando el usuario hace clic para ampliarla: el resto de la
// tienda usa las versiones livianas (thumb / med). Mientras la imagen grande
// carga, se muestra debajo la versión "med" (que ya está en caché porque es la
// que se veía en la ficha), y la grande aparece encima con un fundido apenas
// termina de bajar, así no hay un hueco en blanco.
//
// Dialog se encarga de Escape, atrapar el foco, bloquear el scroll de fondo y
// cerrar al hacer clic afuera.
export default function VisorImagen({ imagenes, indiceInicial = 0, nombre, onClose }) {
  const [indice, setIndice] = useState(indiceInicial);
  const [cargada, setCargada] = useState(false);

  const total = imagenes.length;
  const actual = imagenes[indice];
  const hayVarias = total > 1;

  const anterior = useCallback(() => setIndice((i) => (i - 1 + total) % total), [total]);
  const siguiente = useCallback(() => setIndice((i) => (i + 1) % total), [total]);

  // Al cambiar de foto vuelve a mostrar el "placeholder" hasta que cargue la nueva.
  useEffect(() => setCargada(false), [indice]);

  useEffect(() => {
    if (!hayVarias) return;
    const alPresionarTecla = (e) => {
      if (e.key === "ArrowLeft") anterior();
      else if (e.key === "ArrowRight") siguiente();
    };
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [hayVarias, anterior, siguiente]);

  if (!actual) return null;

  return (
    <Dialog labelledBy="visor-imagen-titulo" onClose={onClose} containerClassName="bg-black/85">
      <h2 id="visor-imagen-titulo" className="sr-only">
        {nombre} — foto {indice + 1} de {total}
      </h2>

      <div className="relative h-[85vh] w-[92vw] max-w-6xl">
        {/* Versión liviana de fondo, ya en caché desde la ficha */}
        <ImagenOptimizada
          src={actual.url}
          variante="med"
          prioridad
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {/* Resolución total: se descarga solo al abrir el visor */}
        <img
          key={actual.url}
          src={actual.url}
          alt={`${nombre} — foto ${indice + 1} de ${total}`}
          decoding="async"
          onLoad={() => setCargada(true)}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            cargada ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar visor de imagen"
        className="absolute -top-2 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-plum shadow-glass transition hover:bg-white sm:-right-12 sm:top-0"
      >
        <IconClose size={18} />
      </button>

      {hayVarias && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum shadow-glass transition hover:bg-white"
          >
            <IconChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-plum shadow-glass transition hover:bg-white"
          >
            <IconChevronRight size={20} />
          </button>
          <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-white/80" aria-hidden="true">
            {indice + 1} / {total}
          </p>
        </>
      )}
    </Dialog>
  );
}
