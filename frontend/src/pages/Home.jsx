import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import CategoryPill from "../components/CategoryPill.jsx";
import { IconChevronLeft, IconChevronRight, IconArrowRight } from "../components/Icons.jsx";
import heroDefecto1 from "../assets/auth/login-hero.jpg";
import heroDefecto2 from "../assets/auth/registro-hero.jpg";

const IMAGENES_POR_DEFECTO = [heroDefecto1, heroDefecto2];

function Hero({ promociones }) {
  const imagenesPromo = promociones.map((p) => p.imagen_url).filter(Boolean);
  const imagenes = imagenesPromo.length > 0 ? imagenesPromo : IMAGENES_POR_DEFECTO;
  const usaCarrusel = true;
  const [indice, setIndice] = useState(0);

  useEffect(() => setIndice(0), [imagenes.length]);

  useEffect(() => {
    if (!usaCarrusel || imagenes.length <= 1) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % imagenes.length), 4500);
    return () => clearInterval(id);
  }, [usaCarrusel, imagenes.length]);

  const anterior = () => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  const siguiente = () => setIndice((i) => (i + 1) % imagenes.length);

  return (
    <section className="relative h-[380px] overflow-hidden rounded-3xl shadow-glass-lg sm:h-[460px]">
      {usaCarrusel ? (
        <>
          {imagenes.map((url, i) => (
            <div
              key={url + i}
              className="absolute inset-0 scale-105 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
              style={{ backgroundImage: `url(${url})`, opacity: i === indice ? 1 : 0 }}
            />
          ))}
          {/* Degradado sutil solo para dar contraste en los bordes, sin tapar la imagen */}
          <div className="absolute inset-0 bg-gradient-to-b from-plum/35 via-transparent to-plum/45" />
        </>
      ) : (
        <>
          <div className="blob blob-berry -left-20 -top-24 h-72 w-72" />
          <div className="blob blob-gold -right-10 top-10 h-64 w-64" />
        </>
      )}

      <div className="relative z-10 mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center sm:px-10">
        <span className="mb-4 inline-block rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-berry-dark shadow-glass">
          Nueva colección
        </span>
        <h1 className="font-display text-3xl font-semibold leading-tight text-white drop-shadow-[0_2px_10px_rgba(43,30,41,0.55)] sm:text-5xl">
          Estilo que se
          <span className="text-gold-soft"> nota</span>, elegancia que se siente
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/90 drop-shadow-[0_1px_6px_rgba(43,30,41,0.5)] sm:text-base">
          Calzados, vestidos, carteras y accesorios seleccionados para tu día a día.
          Envíos a todo el país.
        </p>
        <Link
          to="/tienda"
          className="mt-7 inline-block rounded-full bg-berry px-8 py-3 font-semibold text-white shadow-glass-lg transition hover:scale-[1.03] hover:bg-berry-dark"
        >
          Explorar tienda
        </Link>
      </div>

      {usaCarrusel && imagenes.length > 1 && (
        <>
          <button
            onClick={anterior}
            aria-label="Imagen anterior"
            className="glass absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-plum shadow-glass transition hover:scale-105 hover:bg-white/80 sm:left-6"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            onClick={siguiente}
            aria-label="Siguiente imagen"
            className="glass absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-plum shadow-glass transition hover:scale-105 hover:bg-white/80 sm:right-6"
          >
            <IconChevronRight size={18} />
          </button>
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {imagenes.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setIndice(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                className={`h-1.5 rounded-full shadow-glass transition-all ${
                  i === indice ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const [categorias, setCategorias] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [promociones, setPromociones] = useState([]);

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {});
    api
      .productos({ destacado: "true", por_pagina: 8 })
      .then((data) => setDestacados(data.productos))
      .catch(() => {});
    api.promocionesActivas().then(setPromociones).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <Hero promociones={promociones} />

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
          <h2 className="text-2xl font-bold text-plum">Productos Destacados</h2>
          <Link
            to="/tienda"
            className="flex items-center gap-1.5 rounded-full bg-plum px-4 py-2 text-xs font-semibold text-white transition hover:bg-berry-dark"
          >
            Ver Más
            <IconArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {destacados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      </section>
    </div>
  );
}
