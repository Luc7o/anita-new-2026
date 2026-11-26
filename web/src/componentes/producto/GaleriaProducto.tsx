"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Foto } from "@/componentes/Foto";
import { EVENTO_COLOR } from "@/lib/eventos";

// Galería de la ficha de producto: carrusel como el de la portada (las fotos se funden una en
// otra y pasan solas) con las miniaturas debajo. Se detiene mientras la persona la mira
// (mouse o foco) y no avanza sola si pidió "reducir movimiento" (WCAG 2.2.2). Se maneja con
// las flechas, deslizando el dedo, con el teclado o tocando una miniatura. Si en «Comprar» se
// elige un color, salta a la primera foto de ese color (evento EVENTO_COLOR).

const INTERVALO_MS = 6000;

type FotoGaleria = { id: number; url: string; color: string | null };

function Flecha({ direccion, onClick }: { direccion: "anterior" | "siguiente"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direccion === "anterior" ? "Foto anterior" : "Foto siguiente"}
      className={`absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent text-plum transition-transform duration-200 ease-out hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--c-focus))] ${
        direccion === "anterior" ? "left-2" : "right-2"
      }`}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="[filter:drop-shadow(0_2px_3px_rgb(0_0_0/0.3))]">
        <path d={direccion === "anterior" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

export function GaleriaProducto({ fotos, nombre }: { fotos: FotoGaleria[]; nombre: string }) {
  const total = fotos.length;
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [quieto, setQuieto] = useState(true); // hasta saber la preferencia, no se mueve
  const toqueX = useRef<number | null>(null);
  const fila = useRef<HTMLDivElement>(null);
  const miniaturas = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setQuieto(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const ir = useCallback((paso: number) => setIndice((i) => (i + paso + total) % total), [total]);

  // Avance automático.
  useEffect(() => {
    if (total <= 1 || pausado || quieto) return;
    const id = setTimeout(() => ir(1), INTERVALO_MS);
    return () => clearTimeout(id);
  }, [indice, total, pausado, quieto, ir]);

  // La miniatura activa siempre a la vista: se desplaza solo la fila, en horizontal (así el
  // avance automático nunca mueve la página).
  useEffect(() => {
    const contenedor = fila.current;
    const mini = miniaturas.current[indice];
    if (!contenedor || !mini) return;
    const izquierda = mini.offsetLeft - contenedor.offsetLeft;
    if (izquierda < contenedor.scrollLeft || izquierda + mini.offsetWidth > contenedor.scrollLeft + contenedor.clientWidth) {
      contenedor.scrollTo({ left: izquierda - 8, behavior: quieto ? "auto" : "smooth" });
    }
  }, [indice, quieto]);

  // Color elegido en «Comprar» -> su primera foto.
  useEffect(() => {
    const alElegir = (e: Event) => {
      const color = (e as CustomEvent<string | null>).detail?.toLowerCase();
      const i = fotos.findIndex((f) => f.color?.toLowerCase() === color);
      if (i >= 0) setIndice(i);
    };
    addEventListener(EVENTO_COLOR, alElegir);
    return () => removeEventListener(EVENTO_COLOR, alElegir);
  }, [fotos]);

  if (total === 0) return null;

  return (
    // En computadora la foto es cuadrada (más ancha) y, junto con las miniaturas, entra en la
    // pantalla: el ancho se limita al alto disponible. En celular es 4:5 a todo el ancho.
    <div className="grid w-full gap-3 lg:mx-auto lg:max-w-[calc(100svh-16.5rem)] lg:self-start">
      <section
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${nombre}`}
        className="relative aspect-4/5 w-full overflow-hidden rounded-md bg-[#ecebee] lg:aspect-square"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocusCapture={() => setPausado(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPausado(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") ir(-1);
          if (e.key === "ArrowRight") ir(1);
        }}
        onTouchStart={(e) => (toqueX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const inicio = toqueX.current;
          const fin = e.changedTouches[0]?.clientX;
          toqueX.current = null;
          if (inicio == null || fin == null || Math.abs(fin - inicio) < 50) return;
          ir(fin < inicio ? 1 : -1);
        }}
      >
        {fotos.map((f, i) => {
          const activa = i === indice;
          return (
            <div
              key={f.id}
              role="group"
              aria-roledescription="foto"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={!activa || undefined}
              className={`absolute inset-0 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activa ? "scale-100 opacity-100" : "pointer-events-none scale-[1.03] opacity-0"
              }`}
            >
              <Foto
                url={f.url || null}
                alt={i === 0 ? nombre : `${nombre}, foto ${i + 1}`}
                prioridad={i === 0}
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            </div>
          );
        })}

        {total > 1 && (
          <>
            <Flecha direccion="anterior" onClick={() => ir(-1)} />
            <Flecha direccion="siguiente" onClick={() => ir(1)} />
            <p className="absolute bottom-3 right-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white" aria-hidden="true">
              {indice + 1} / {total}
            </p>
          </>
        )}
      </section>

      {total > 1 && (
        <div ref={fila} role="group" aria-label="Elegir foto" className="relative flex gap-2 overflow-x-auto p-1">
          {fotos.map((f, i) => {
            const activa = i === indice;
            const optimizable = f.url.includes(".public.blob.vercel-storage.com");
            return (
              <button
                key={f.id}
                ref={(el) => {
                  miniaturas.current[i] = el;
                }}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver foto ${i + 1}${f.color ? ` (${f.color})` : ""}`}
                aria-current={activa ? "true" : undefined}
                className={`relative aspect-4/5 w-18 shrink-0 overflow-hidden rounded-md bg-[#ecebee] transition duration-300 sm:w-20 ${
                  activa ? "opacity-100 ring-2 ring-plum ring-offset-2 ring-offset-ivory" : "opacity-55 hover:opacity-100"
                }`}
              >
                {f.url && <Image src={f.url} alt="" fill sizes="80px" unoptimized={!optimizable} className="object-cover" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
