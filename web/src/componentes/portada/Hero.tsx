"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductoResumen } from "@/lib/catalogo";
import type { Promocion } from "@/lib/portada";
import { soles } from "@/lib/precio";
import { COSTO_DELIVERY } from "@/lib/tienda";
import { EtiquetaOferta } from "../EtiquetaOferta";
import { Foto } from "../Foto";
import { IconoCamion, IconoCarrito, IconoDerecha, IconoEtiqueta, IconoIzquierda } from "../Iconos";

const POR_DEFECTO = ["/portada/hero-1.webp", "/portada/hero-2.webp"];

// Portada: carrusel de promociones (o fotos de la tienda si no hay ninguna vigente) con la
// oferta destacada al costado. El carrusel se detiene mientras la persona lo mira (mouse o
// foco) y no avanza solo si pidió "reducir movimiento" (WCAG 2.2.2).
export function Hero({ promociones, oferta }: { promociones: Promocion[]; oferta: ProductoResumen | null }) {
  const hayPromos = promociones.length > 0;
  const imagenes = hayPromos ? promociones.map((p) => p.imagenUrl) : POR_DEFECTO;
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [quieto, setQuieto] = useState(true); // hasta saber la preferencia, no se mueve

  useEffect(() => {
    const consulta = matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setQuieto(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  useEffect(() => {
    if (imagenes.length <= 1 || pausado || quieto) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % imagenes.length), 5500);
    return () => clearInterval(id);
  }, [imagenes.length, pausado, quieto]);

  const promo = hayPromos ? promociones[indice] : null;
  const externo = promo?.botonLink.startsWith("http");

  return (
    <section
      className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-10 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pb-16 md:pt-12"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPausado(false);
      }}
    >
      <div className="flex flex-col" aria-live={pausado || quieto ? "polite" : "off"}>
        {promo?.etiqueta && <span className="aviso-fino mb-5 self-start">{promo.etiqueta}</span>}
        <h1 className="animate-fade-in-up font-display text-[clamp(3rem,6vw,5.8rem)] leading-[0.98] text-plum" style={{ animationDelay: "80ms" }}>
          {promo ? promo.titulo : <>Moda elegida en <em className="text-berry">Huancayo</em></>}
        </h1>
        <p className="mt-6 max-w-[34ch] animate-fade-in-up text-[19px] leading-relaxed text-plum-soft" style={{ animationDelay: "160ms" }}>
          {promo?.descripcion ??
            "Carteras, calzado y accesorios elegidos pieza por pieza. Recógelos en la tienda o recíbelos en tu casa."}
        </p>
        <div className="mt-7 flex animate-fade-in-up flex-wrap items-center gap-5" style={{ animationDelay: "240ms" }}>
          {promo && externo ? (
            <a href={promo.botonLink} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-12!">
              {promo.botonTexto}
            </a>
          ) : (
            <Link href={promo?.botonLink ?? "/tienda"} className="btn-primary min-h-12!">
              {promo?.botonTexto ?? "Ver lo nuevo"}
            </Link>
          )}
          <span className="aviso-fino">Recojo gratis en tienda</span>
        </div>
        <p className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-plum">
          <span className="inline-flex items-center gap-2"><IconoCamion size={16} /> Delivery en Huancayo {soles(COSTO_DELIVERY)}</span>
          <span className="inline-flex items-center gap-2"><IconoEtiqueta size={16} /> Paga con tarjeta o Yape</span>
        </p>
      </div>

      <figure className="relative m-0">
        <div className="relative aspect-5/6 overflow-hidden rounded-md bg-[#ecebee]">
          {imagenes.map((url, i) => (
            <Image
              key={url + i}
              src={url}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 45vw, 100vw"
              unoptimized={url.startsWith("http") && !url.includes(".public.blob.vercel-storage.com")}
              className="scale-105 object-cover transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === indice ? 1 : 0 }}
            />
          ))}
          <span className="aviso-fino absolute left-4 top-4 z-10">Nuevo esta semana</span>
          {imagenes.length > 1 && (
            <div className="absolute bottom-3 left-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length)}
                aria-label="Imagen anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum transition hover:bg-plum hover:text-ivory"
              >
                <IconoIzquierda />
              </button>
              <button
                type="button"
                onClick={() => setIndice((i) => (i + 1) % imagenes.length)}
                aria-label="Siguiente imagen"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum transition hover:bg-plum hover:text-ivory"
              >
                <IconoDerecha />
              </button>
            </div>
          )}
        </div>

        {oferta && (
          <div className="mt-3.5 grid gap-2 bg-white p-[18px] shadow-[inset_0_0_0_2px_rgb(var(--c-plum))] md:absolute md:-right-4 md:bottom-6 md:mt-0 md:w-[340px] dark:bg-ivory">
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
              <div className="foto-vacia relative h-20 w-16 overflow-hidden rounded">
                <Foto url={oferta.imagenUrl} alt="" sizes="64px" />
              </div>
              <div className="grid gap-1">
                <span className="font-display text-[22px] font-bold leading-[1.15] text-plum">{oferta.nombre}</span>
                {oferta.categoria && <span className="text-sm text-plum-soft">{oferta.categoria.nombre}</span>}
              </div>
            </div>
            <div className="mb-2 flex items-start gap-[18px]">
              <EtiquetaOferta precio={oferta.precioFinal} antes={oferta.precio} />
              <p className="pt-11 text-sm leading-normal text-plum-soft">
                Ahorras <b className="font-extrabold text-plum">{soles(oferta.precio - oferta.precioFinal)}</b>
                <br />
                Recojo gratis en tienda
              </p>
            </div>
            <Link href={`/producto/${oferta.id}`} className="btn-primary w-full">
              <IconoCarrito size={16} /> Ver y agregar
            </Link>
          </div>
        )}
      </figure>
    </section>
  );
}
