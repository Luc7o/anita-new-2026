import React from "react";
import { Link } from "react-router-dom";

export default function CategoryPill({ categoria, activo = false }) {
  return (
    <Link
      to={`/tienda?categoria=${categoria.slug}`}
      aria-current={activo ? "true" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-glass transition hover:-translate-y-0.5 ${
        activo
          ? "bg-berry text-white"
          : "glass text-plum hover:bg-white/80 hover:text-berry-dark"
      }`}
    >
      {categoria.nombre}
    </Link>
  );
}
