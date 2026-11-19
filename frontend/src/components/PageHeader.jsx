import React from "react";
import { Link } from "react-router-dom";

/**
 * Cabecera de las páginas internas («Galería Carbón»): clara, sobre el fondo hueso, con la
 * ruta de navegación, un título grande en Syne y una línea fina abajo. Sin degradados: el
 * color se reserva para los productos y las ofertas.
 * `ruta` (opcional): [{ to, label }] para la ruta de navegación; el último paso es la página actual.
 */
export default function PageHeader({ eyebrow, titulo, subtitulo, ruta, children }) {
  return (
    <section className="border-b border-plum/10">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-8 md:pb-10 md:pt-12">
        {ruta?.length > 0 && (
          <nav aria-label="Ruta" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-plum-soft">
            {ruta.map((paso, i) => (
              <React.Fragment key={paso.label}>
                {i > 0 && <span aria-hidden="true">/</span>}
                {paso.to ? (
                  <Link to={paso.to} className="transition-colors hover:text-berry">
                    {paso.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-plum">
                    {paso.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="animate-fade-in-up text-xs font-bold uppercase tracking-[0.18em] text-berry">{eyebrow}</p>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1
            className="mt-2 animate-fade-in-up font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-plum sm:text-5xl md:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            {titulo}
          </h1>
          {children}
        </div>
        {subtitulo && (
          <p className="mt-3 max-w-xl animate-fade-in-up text-plum-soft" style={{ animationDelay: "120ms" }}>
            {subtitulo}
          </p>
        )}
      </div>
    </section>
  );
}
