import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconCart, IconStar } from "./Icons.jsx";

export default function ProductCard({ producto }) {
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState("");

  const necesitaOpciones =
    (producto.tallas && producto.tallas.length > 0) || (producto.colores && producto.colores.length > 0);

  const handleComprar = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link
      to={`/producto/${producto.id}`}
      className="glass group relative flex flex-col overflow-hidden rounded-3xl shadow-glass transition hover:-translate-y-1 hover:shadow-glass-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-lilac to-white">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-berry-light/60">
            {producto.nombre.slice(0, 1)}
          </div>
        )}

        {producto.tiene_oferta && (
          <span className="absolute left-3 top-3 rounded-full bg-berry px-3 py-1 text-xs font-semibold text-white shadow-glass">
            -{producto.descuento_porcentaje}%
          </span>
        )}
        {producto.sin_stock && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-body text-sm font-semibold text-plum-soft backdrop-blur-sm">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-plum-soft">
          {producto.categoria_nombre}
        </span>
        <h3 className="font-display text-base font-medium leading-snug text-plum">
          {producto.nombre}
        </h3>
        {producto.total_resenas > 0 && (
          <div className="flex items-center gap-1">
            <IconStar size={12} relleno className="text-gold" />
            <span className="text-xs text-plum-soft">
              {producto.promedio_calificacion} ({producto.total_resenas})
            </span>
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-lg font-semibold text-berry-dark">
            S/ {producto.precio_final.toFixed(2)}
          </span>
          {producto.tiene_oferta && (
            <span className="text-sm text-plum-soft line-through">
              S/ {producto.precio.toFixed(2)}
            </span>
          )}
        </div>

        {!producto.sin_stock && (
          <button
            onClick={handleComprar}
            disabled={cargando}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-berry py-2 text-xs font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            <IconCart size={14} />
            {cargando ? "Procesando..." : "Comprar"}
          </button>
        )}
      </div>
    </Link>
  );
}
