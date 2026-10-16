import React from "react";
import { Link } from "react-router-dom";

export default function CategoryPill({ categoria, activo = false }) {
  return (
    <Link
      to={`/tienda?categoria=${categoria.slug}`}
      aria-current={activo ? "true" : undefined}
      className={`shrink-0 ${activo ? "chip-on" : "chip-off"}`}
    >
      {categoria.nombre}
    </Link>
  );
}
