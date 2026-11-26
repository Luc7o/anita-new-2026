"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductoResumen } from "@/lib/catalogo";
import { IconoFlecha } from "../Iconos";
import { TarjetaProducto } from "../TarjetaProducto";

// «Lo nuevo de la semana» con pestañas por categoría. Las listas llegan ya armadas desde el
// servidor, así que cambiar de pestaña es instantáneo y no hay pantallas de carga. Al final,
// «Ver más» lleva a la tienda completa (o a la categoría de la pestaña elegida).
export function LoNuevo({ pestanas, listas }: { pestanas: { slug: string; nombre: string }[]; listas: Record<string, ProductoResumen[]> }) {
  const [activa, setActiva] = useState("todo");
  const productos = listas[activa] ?? [];

  return (
    <section className="regla mx-auto max-w-7xl px-4 pb-18 pt-14 sm:px-8">
      <div className="revelar mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">Lo nuevo de la semana</h2>
        {pestanas.length > 1 && (
          <div
            role="tablist"
            aria-label="Filtrar por categoría"
            onKeyDown={(e) => {
              // Flechas izquierda/derecha para moverse entre pestañas, como pide el patrón ARIA.
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const i = pestanas.findIndex((p) => p.slug === activa);
              const siguiente = pestanas[(i + (e.key === "ArrowRight" ? 1 : -1) + pestanas.length) % pestanas.length]!;
              setActiva(siguiente.slug);
              document.getElementById(`pestana-${siguiente.slug}`)?.focus();
            }}
            className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_rgb(var(--c-plum)/0.2)] dark:bg-white/5">
            {pestanas.map((p) => (
              <button
                key={p.slug}
                type="button"
                role="tab"
                id={`pestana-${p.slug}`}
                aria-selected={activa === p.slug}
                tabIndex={activa === p.slug ? 0 : -1}
                aria-controls="lo-nuevo-panel"
                onClick={() => setActiva(p.slug)}
                className={`min-h-11 rounded-full px-4 text-sm font-bold transition-colors ${
                  activa === p.slug ? "bg-plum text-ivory" : "text-plum-soft hover:text-plum"
                }`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div id="lo-nuevo-panel" role="tabpanel" aria-labelledby={`pestana-${activa}`}>
        {productos.length === 0 ? (
          <p className="text-plum-soft">Todavía no hay productos en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {productos.map((p, i) => (
              <TarjetaProducto key={`${activa}-${p.id}`} producto={p} indice={i} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-12 flex justify-center">
        <Link href={activa === "todo" ? "/tienda" : `/tienda?categoria=${encodeURIComponent(activa)}`} className="btn-secondary">
          Ver más <IconoFlecha size={16} />
        </Link>
      </div>
    </section>
  );
}
