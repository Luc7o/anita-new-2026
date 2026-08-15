import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import CategoryPill from "../components/CategoryPill.jsx";

export default function Home() {
  const [categorias, setCategorias] = useState([]);
  const [destacados, setDestacados] = useState([]);

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {});
    api
      .productos({ destacado: "true", por_pagina: 8 })
      .then((data) => setDestacados(data.productos))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl px-6 py-20 sm:px-12">
        <div className="blob blob-berry -left-20 -top-24 h-72 w-72" />
        <div className="blob blob-gold -right-10 top-10 h-64 w-64" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-berry-dark shadow-glass">
            Nueva colección
          </span>
          <h1 className="font-display text-4xl font-semibold leading-tight text-plum sm:text-6xl">
            Estilo que se
            <span className="text-berry-dark"> nota</span>, elegancia que se siente
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-plum-soft">
            Calzados, vestidos, carteras y accesorios seleccionados para tu día a día.
            Envíos a todo el país.
          </p>
          <Link
            to="/tienda"
            className="mt-8 inline-block rounded-full bg-berry px-8 py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark"
          >
            Explorar tienda
          </Link>
        </div>
      </section>

      {/* Categorías */}
      <section className="mt-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-plum">Categorías</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categorias.map((cat) => (
            <CategoryPill key={cat.id} categoria={cat} />
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="mb-16 mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-plum">Destacados</h2>
          <Link to="/tienda" className="text-sm font-medium text-berry hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {destacados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </section>
    </div>
  );
}
