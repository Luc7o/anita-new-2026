import React from "react";
import { Link } from "react-router-dom";

export default function PaginaInfo({ titulo, volver = "/", contenido }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link
        to={volver}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-plum-soft transition hover:text-plum"
      >
        <span aria-hidden="true">&larr;</span>
        Volver
      </Link>

      <div className="rounded-2xl border border-plum/10 bg-white/40 p-6 shadow-sm backdrop-blur-md sm:p-10">
        <h1 className="mb-6 text-2xl font-bold text-plum sm:text-3xl">{titulo}</h1>
        <div className="text-plum-soft">{contenido}</div>
      </div>
    </div>
  );
}
