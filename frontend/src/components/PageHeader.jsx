import React from "react";

/** Cabecera oscura con curva inferior, compartida por las páginas internas (estructura de Malhu). */
export default function PageHeader({ eyebrow, titulo, subtitulo }) {
  return (
    <section className="bg-gradient-to-br from-plum via-berry-dark to-berry text-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pt-14">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-berry-light">{eyebrow}</p>
        )}
        <h1 className="mt-2 font-sans text-3xl font-extrabold uppercase sm:text-4xl md:text-5xl">{titulo}</h1>
        {subtitulo && <p className="mt-3 max-w-xl text-white/75">{subtitulo}</p>}
      </div>
      <div className="h-8 rounded-t-[50%_/_32px] bg-ivory" aria-hidden="true" />
    </section>
  );
}
