"use client";

import Link from "next/link";
import { useState } from "react";
import { URL_API } from "@/lib/sitio";
import { Foto } from "@/componentes/Foto";

import { Estrellas, POR_PAGINA, type PaginaResenas, type Resena } from "./comun";

function TarjetaResena({ r }: { r: Resena }) {
  return (
    <article className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-plum">{r.autor}</h3>
          {r.compra_verificada && <span className="text-xs font-medium text-berry">Compra verificada</span>}
        </div>
        <Estrellas valor={r.calificacion} size={15} />
      </div>
      {r.comentario && <p className="mt-2 text-sm text-plum-soft">{r.comentario}</p>}
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-plum/10 pt-3">
        <Link href={`/producto/${r.producto.id}`} className="flex min-w-0 items-center gap-2 text-xs text-plum-soft transition hover:text-berry">
          {r.producto.imagen_url && (
            <span className="relative h-9 w-9 flex-none overflow-hidden rounded-lg">
              <Foto url={r.producto.imagen_url} alt="" sizes="36px" />
            </span>
          )}
          <span className="truncate">{r.producto.nombre}</span>
        </Link>
        <time className="flex-none text-xs text-plum-soft/70" dateTime={r.fecha_creacion}>
          {new Date(r.fecha_creacion).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
        </time>
      </div>
    </article>
  );
}

/** La primera página llega ya armada del servidor; "Ver más" pide las siguientes. */
export function ListaResenas({ inicial }: { inicial: PaginaResenas }) {
  const [resenas, setResenas] = useState(inicial.resenas);
  const [hayMas, setHayMas] = useState(inicial.hay_mas);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const verMas = async () => {
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`${URL_API}/resenas?limite=${POR_PAGINA}&offset=${resenas.length}`);
      if (!r.ok) throw new Error();
      const datos = (await r.json()) as PaginaResenas;
      setResenas((prev) => [...prev, ...datos.resenas]);
      setHayMas(datos.hay_mas);
    } catch {
      setError("No pudimos cargar más reseñas. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {resenas.map((r) => (
          <TarjetaResena key={r.id} r={r} />
        ))}
      </div>
      {error && <p className="text-sm text-berry" role="alert">{error}</p>}
      {hayMas && (
        <div className="text-center">
          <button
            type="button"
            onClick={verMas}
            disabled={cargando}
            className="rounded-2xl border border-plum/15 bg-white/70 px-6 py-2.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white disabled:opacity-60"
          >
            {cargando ? "Cargando…" : "Ver más reseñas"}
          </button>
        </div>
      )}
    </>
  );
}
