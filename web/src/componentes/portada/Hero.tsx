"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Diapositiva } from "@/lib/portada";
import { soles } from "@/lib/precio";

// Portada: carrusel a todo el ancho con el producto sin fondo (o render 3D) flotando al centro,
// el título a la izquierda y el detalle a la derecha. Las diapositivas salen de Promociones del
// panel; sin promociones vigentes, de los productos destacados. Se detiene mientras la persona
// lo mira (mouse o foco) y no avanza solo ni se inclina si pidió "reducir movimiento" (WCAG 2.2.2).

const INTERVALO_MS = 6000;

function Flecha({ direccion, onClick }: { direccion: "anterior" | "siguiente"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direccion === "anterior" ? "Diapositiva anterior" : "Diapositiva siguiente"}
      className={`absolute top-1/2 z-20 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent text-plum transition-transform duration-200 ease-out hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--c-focus))] ${
        direccion === "anterior" ? "left-1 sm:left-4 lg:left-8" : "right-1 sm:right-4 lg:right-8"
      }`}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="[filter:drop-shadow(0_2px_3px_rgb(0_0_0/0.35))]"
      >
        <path d={direccion === "anterior" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

export function Hero({ diapositivas }: { diapositivas: Diapositiva[] }) {
  const total = diapositivas.length;
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [quieto, setQuieto] = useState(true); // hasta saber la preferencia, no se mueve
  const escena = useRef<HTMLElement>(null);
  const toqueX = useRef<number | null>(null);

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setQuieto(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const ir = useCallback((paso: number) => setIndice((i) => (i + paso + total) % total), [total]);

  useEffect(() => {
    if (total <= 1 || pausado || quieto) return;
    const id = setTimeout(() => ir(1), INTERVALO_MS);
    return () => clearTimeout(id);
  }, [indice, total, pausado, quieto, ir]);

  // Inclinación leve del producto siguiendo el mouse (sensación 3D). Solo con mouse y movimiento permitido.
  const inclinar = (e: React.PointerEvent<HTMLElement>) => {
    if (quieto || e.pointerType !== "mouse" || !escena.current) return;
    const caja = escena.current.getBoundingClientRect();
    const x = (e.clientX - caja.left) / caja.width - 0.5;
    const y = (e.clientY - caja.top) / caja.height - 0.5;
    escena.current.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
    escena.current.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
  };
  const enderezar = () => {
    escena.current?.style.setProperty("--ry", "0deg");
    escena.current?.style.setProperty("--rx", "0deg");
  };

  if (!total) return <h1 className="sr-only">Anita New Style, moda en Huancayo</h1>;

  return (
    <section
      ref={escena}
      aria-roledescription="carrusel"
      aria-label="Destacados de la tienda"
      className="relative isolate w-full overflow-hidden bg-ivory [--rx:0deg] [--ry:0deg]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => {
        setPausado(false);
        enderezar();
      }}
      onPointerMove={inclinar}
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
      <h1 className="sr-only">Anita New Style, moda en Huancayo</h1>

      {/* Escenario: luz suave detrás del producto y un piso que se funde con la página. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[38%] h-[95%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-berry)/0.20),rgb(var(--c-berry)/0.06)_55%,transparent)] md:top-1/2 md:h-[115%] md:w-[60%]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-plum/[0.06] to-transparent" />
      </div>

      <div className="relative h-[clamp(600px,86svh,860px)]">
        {diapositivas.map((d, i) => {
          const activa = i === indice;
          const externo = d.botonLink.startsWith("http");
          const optimizable = d.imagenUrl.includes(".public.blob.vercel-storage.com");
          return (
            <div
              key={d.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${total}: ${d.titulo}`}
              inert={!activa || undefined}
              className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${activa ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div className="mx-auto grid h-full max-w-7xl grid-rows-[minmax(0,1fr)_auto_auto] items-center gap-3 px-14 pb-16 pt-4 sm:px-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] md:grid-rows-1 md:gap-8 md:pb-12 md:pt-6">
                {/* Izquierda: etiqueta y título */}
                <div
                  className={`order-2 flex flex-col items-start transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:order-1 ${activa ? "translate-x-0 opacity-100 delay-150" : "-translate-x-6 opacity-0"}`}
                >
                  {d.etiqueta && <span className="aviso-fino aviso-m mb-4">{d.etiqueta}</span>}
                  <h2 className="font-display text-[clamp(2.1rem,4.2vw,4.4rem)] leading-[0.98] text-plum text-balance">{d.titulo}</h2>
                </div>

                {/* Centro: el producto flotando */}
                <div className="relative order-1 h-full min-h-0 w-full md:order-2">
                  <div
                    className={`absolute inset-0 transition duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${activa ? "translate-y-0 scale-100" : "translate-y-[6%] scale-90"}`}
                  >
                    <div className="absolute inset-[8%_4%_16%] [transform:perspective(1400px)_rotateX(var(--rx))_rotateY(var(--ry))] transition-transform duration-500 ease-out [transform-style:preserve-3d]">
                      <div className={`relative h-full w-full ${quieto ? "" : "animate-[flotar_7s_ease-in-out_infinite]"}`}>
                        <Image
                          src={d.imagenUrl}
                          alt={d.producto?.nombre ?? d.titulo}
                          fill
                          priority={i === 0}
                          // Son pocas: se cargan todas de entrada para que ninguna aparezca tarde al rotar.
                          loading={i === 0 ? undefined : "eager"}
                          sizes="(min-width: 768px) 42vw, 90vw"
                          unoptimized={!optimizable}
                          className="object-contain [filter:drop-shadow(0_28px_30px_rgb(0_0_0/0.28))]"
                        />
                      </div>
                    </div>
                    {/* Sombra en el piso */}
                    <div
                      aria-hidden="true"
                      className="absolute bottom-[9%] left-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-plum/25 blur-xl dark:bg-black/70"
                    />
                  </div>
                </div>

                {/* Derecha: descripción, precio y botón */}
                <div
                  className={`order-3 flex flex-col items-start transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:justify-self-end ${activa ? "translate-x-0 opacity-100 delay-200" : "translate-x-6 opacity-0"}`}
                >
                  {d.descripcion && (
                    <p className="max-w-[30ch] text-base leading-relaxed text-plum-soft sm:text-lg">{d.descripcion}</p>
                  )}
                  {d.producto && (
                    <p className="mt-4 flex items-baseline gap-3 md:mt-5">
                      <span className="font-display text-3xl font-bold text-plum sm:text-4xl">{soles(d.producto.precioFinal)}</span>
                      {d.producto.tieneOferta && (
                        <span className="text-base text-plum-soft line-through">{soles(d.producto.precio)}</span>
                      )}
                    </p>
                  )}
                  {externo ? (
                    <a href={d.botonLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 min-h-12! md:mt-7">
                      {d.botonTexto}
                    </a>
                  ) : (
                    <Link href={d.botonLink} className="btn-primary mt-5 min-h-12! md:mt-7">
                      {d.botonTexto}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {total > 1 && (
          <>
            <Flecha direccion="anterior" onClick={() => ir(-1)} />
            <Flecha direccion="siguiente" onClick={() => ir(1)} />
            <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2">
              {diapositivas.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ir a la diapositiva ${i + 1}: ${d.titulo}`}
                  aria-current={i === indice ? "true" : undefined}
                  className="group grid h-6 place-items-center px-0.5"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all duration-500 ${i === indice ? "w-9 bg-plum" : "w-4 bg-plum/25 group-hover:bg-plum/50"}`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
