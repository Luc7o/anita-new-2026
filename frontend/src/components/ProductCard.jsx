import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconStar, IconHeart } from "./Icons.jsx";

export default function ProductCard({ producto }) {
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);

  const necesitaOpciones =
    (producto.tallas && producto.tallas.length > 0) || (producto.colores && producto.colores.length > 0);

  const esFavorito = favoritos?.esFavorito(producto.id);

  const handleComprar = async () => {
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    if (necesitaOpciones) {
      navigate(`/producto/${producto.id}`);
      return;
    }
    setCargando(true);
    try {
      await agregar(producto.id);
      navigate("/checkout");
    } finally {
      setCargando(false);
    }
  };

  const handleFavorito = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    favoritos?.alternar(producto.id);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-plum/10 bg-white transition hover:shadow-lg">
      <Link to={`/producto/${producto.id}`} className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-berry">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-lilac">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-berry-light/60">
              {producto.nombre.slice(0, 1)}
            </div>
          )}

          {producto.tiene_oferta ? (
            <span className="absolute left-3 top-3 rounded-full bg-berry px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Oferta
            </span>
          ) : producto.es_nuevo ? (
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-plum shadow-sm">
              Nuevo
            </span>
          ) : null}

          {producto.sin_stock && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-plum-soft backdrop-blur-sm">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-5 pb-0">
          <span className="text-xs uppercase tracking-wide text-plum-soft">Anita New Style</span>
          <h3 className="text-base font-semibold leading-snug text-plum">{producto.nombre}</h3>
          {producto.total_resenas > 0 && (
            <div className="flex items-center gap-1">
              <IconStar size={13} relleno className="text-gold" />
              <span className="text-xs text-plum-soft">
                {producto.promedio_calificacion} ({producto.total_resenas})
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between px-5 pb-2.5 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-berry">S/{producto.precio_final.toFixed(2)}</span>
          {producto.tiene_oferta && (
            <span className="text-sm text-plum-soft line-through">S/{producto.precio.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleFavorito}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={esFavorito}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-110 ${
            esFavorito ? "border-berry bg-berry text-white" : "border-plum/15 text-plum-soft hover:text-berry"
          }`}
        >
          <IconHeart size={14} relleno={esFavorito} />
        </button>
      </div>

      {!producto.sin_stock && (
        <div className="px-5 pb-5 pt-1">
          <button
            onClick={handleComprar}
            disabled={cargando}
            aria-label={`Comprar ${producto.nombre}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-plum py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            <IconCart size={14} />
            {cargando ? "Procesando..." : "Comprar"}
          </button>
        </div>
      )}
    </div>
  );
}
