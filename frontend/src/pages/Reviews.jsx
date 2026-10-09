import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import Estrellas from "../components/Estrellas.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import { api } from "../api/client.js";
import { EMPRESA } from "../datosEmpresa.js";

const POR_PAGINA = 12;

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Resumen({ total, promedio, distribucion }) {
  return (
    <div className="grid gap-4 rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm sm:grid-cols-[auto,1fr] sm:items-center">
      <div className="text-center sm:px-6">
        <p className="text-4xl font-bold text-plum">{promedio?.toFixed(1)}</p>
        <div className="mt-1 flex justify-center">
          <Estrellas valor={promedio} size={16} />
        </div>
        <p className="mt-1 text-xs text-plum-soft">
          {total} {total === 1 ? "reseña" : "reseñas"}
        </p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const cantidad = distribucion?.[String(n)] || 0;
          const pct = total ? (cantidad / total) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs text-plum-soft">
              <span className="w-3 text-right">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-plum/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right">{cantidad}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TarjetaResena({ r }) {
  return (
    <article className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-plum">{r.autor}</h3>
          {r.compra_verificada && (
            <span className="text-xs font-medium text-berry">Compra verificada</span>
          )}
        </div>
        <Estrellas valor={r.calificacion} size={15} />
      </div>

      {r.comentario && <p className="mt-2 text-sm text-plum-soft">{r.comentario}</p>}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-plum/10 pt-3">
        <Link
          to={`/producto/${r.producto.id}`}
          className="flex min-w-0 items-center gap-2 text-xs text-plum-soft transition hover:text-berry"
        >
          {r.producto.imagen_url && (
            <ImagenOptimizada
              src={r.producto.imagen_url}
              alt=""
              className="h-9 w-9 flex-none rounded-lg object-cover"
            />
          )}
          <span className="truncate">{r.producto.nombre}</span>
        </Link>
        <time className="flex-none text-xs text-plum-soft/70" dateTime={r.fecha_creacion}>
          {formatearFecha(r.fecha_creacion)}
        </time>
      </div>
    </article>
  );
}

// Reseñas reales leídas de la base de datos. No hay ningún texto de ejemplo:
// si todavía nadie reseñó un producto, se muestra un mensaje de "aún no hay".
export default function Reviews() {
  const [resenas, setResenas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (offset = 0) => {
    try {
      const data = await api.resenasRecientes({ limite: POR_PAGINA, offset });
      setResenas((prev) => (offset === 0 ? data.resenas : [...prev, ...data.resenas]));
      setResumen({ total: data.total, promedio: data.promedio, distribucion: data.distribucion });
      setHayMas(data.hay_mas);
      setError("");
    } catch (e) {
      setError(e.message || "No pudimos cargar las reseñas. Intenta de nuevo.");
    }
  }, []);

  useEffect(() => {
    setCargando(true);
    cargar(0).finally(() => setCargando(false));
  }, [cargar]);

  const verMas = async () => {
    setCargandoMas(true);
    await cargar(resenas.length);
    setCargandoMas(false);
  };

  return (
    <PaginaInfo
      titulo="Reviews de clientes"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Opiniones reales de clientas de <strong className="text-plum">{EMPRESA.nombre}</strong>.
            Solo pueden reseñar quienes compraron el producto.
          </p>

          {cargando && <p className="text-sm text-plum-soft">Cargando reseñas…</p>}

          {!cargando && error && resenas.length === 0 && (
            <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
              <p className="text-sm text-plum-soft">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setCargando(true);
                  cargar(0).finally(() => setCargando(false));
                }}
                className="mt-3 text-sm font-semibold text-berry hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !error && resumen?.total === 0 && (
            <div className="rounded-xl border border-plum/10 bg-plum/5 p-6 text-center">
              <p className="font-medium text-plum">Aún no hay reseñas</p>
              <p className="mt-1 text-sm text-plum-soft">
                Cuando una clienta califique un producto que compró, su opinión aparecerá aquí.
              </p>
              <Link
                to="/tienda"
                className="mt-4 inline-block rounded-2xl bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
              >
                Ver la tienda
              </Link>
            </div>
          )}

          {!cargando && resumen?.total > 0 && (
            <>
              <Resumen {...resumen} />

              <div className="space-y-4">
                {resenas.map((r) => (
                  <TarjetaResena key={r.id} r={r} />
                ))}
              </div>

              {error && <p className="text-sm text-berry">{error}</p>}

              {hayMas && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={verMas}
                    disabled={cargandoMas}
                    className="rounded-2xl border border-plum/15 bg-white/70 px-6 py-2.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white disabled:opacity-60"
                  >
                    {cargandoMas ? "Cargando…" : "Ver más reseñas"}
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
                <p className="text-sm font-medium text-plum">¿Ya compraste con nosotros?</p>
                <p className="mt-1 text-sm text-plum-soft">
                  Entra al producto que compraste y deja tu reseña. Aparece aquí al instante.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
