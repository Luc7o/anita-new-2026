import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import { SkeletonPills, SkeletonProductGrid } from "../components/Skeleton.jsx";
import { IconChevronLeft, IconChevronRight, IconArrowRight } from "../components/Icons.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import { urlVariante } from "../utils/imagenes.js";
import heroDefecto1 from "../assets/auth/login-hero.webp";
import heroDefecto2 from "../assets/auth/registro-hero.webp";

const IMAGENES_POR_DEFECTO = [heroDefecto1, heroDefecto2];

// Slide del carrusel. Usa la versión "lg" (1600 px, WebP) en vez del original,
// que puede ser una foto 4K. Como es un background-image no existe onError:
// se prueba la carga con un Image() y, si la versión lg no existe todavía
// (imagen subida antes de la optimización y aún no migrada), se usa el original.
function SlideHero({ url, visible }) {
  const [src, setSrc] = useState(() => urlVariante(url, "lg"));

  useEffect(() => {
    const lg = urlVariante(url, "lg");
    setSrc(lg);
    if (lg === url) return;
    const sonda = new Image();
    sonda.onerror = () => setSrc(url);
    sonda.src = lg;
  }, [url]);

  return (
    <div
      className="absolute inset-0 scale-105 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
      style={{ backgroundImage: `url(${src})`, opacity: visible ? 1 : 0 }}
    />
  );
}

function Hero({ promociones }) {
  // Solo promociones con imagen entran al carrusel; se mantiene el mismo orden
  // para que el índice siga apuntando a la promoción correcta.
  const slides = promociones.filter((p) => p.imagen_url);
  const hayPromos = slides.length > 0;
  const imagenes = hayPromos ? slides.map((p) => p.imagen_url) : IMAGENES_POR_DEFECTO;
  const [indice, setIndice] = useState(0);

  useEffect(() => setIndice(0), [imagenes.length]);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % imagenes.length), 4500);
    return () => clearInterval(id);
  }, [imagenes.length]);

  const anterior = () => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  const siguiente = () => setIndice((i) => (i + 1) % imagenes.length);

  const promoActual = hayPromos ? slides[indice] : null;
  const esLinkExterno = promoActual?.boton_link?.startsWith("http");
  const claseBoton = "btn mt-7 !rounded-[10px] bg-white/90 !px-6 !py-3 text-base text-plum hover:bg-white";

  return (
    <section className="bg-gradient-to-br from-plum via-berry-dark to-berry text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-12 md:grid-cols-[1.1fr_0.9fr] md:pb-32 md:pt-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-berry-light">
            {promoActual ? promoActual.etiqueta || "Anita New Style" : "Nueva colección"}
          </p>
          <h1 className="mt-3 font-sans text-4xl font-extrabold uppercase leading-[1.05] sm:text-5xl lg:text-6xl">
            {promoActual ? (
              promoActual.titulo
            ) : (
              <>
                Estilo que se nota.
                <br />
                Elegancia que se siente.
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/75">
            {promoActual
              ? promoActual.descripcion
              : "Calzados, vestidos, carteras y accesorios seleccionados para tu día a día. Delivery en Huancayo."}
          </p>
          {esLinkExterno ? (
            <a href={promoActual.boton_link} target="_blank" rel="noopener noreferrer" className={claseBoton}>
              {promoActual.boton_texto}
            </a>
          ) : (
            <Link to={promoActual ? promoActual.boton_link : "/tienda"} className={claseBoton}>
              {promoActual ? promoActual.boton_texto : "Explorar tienda"}
            </Link>
          )}
        </div>

        <div className="mx-auto w-full max-w-sm md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-plum shadow-pop ring-1 ring-white/15 sm:aspect-[5/4] md:aspect-[4/5]">
            {imagenes.map((url, i) => (
              <SlideHero key={url + i} url={url} visible={i === indice} />
            ))}
            {imagenes.length > 1 && (
              <>
                <button
                  onClick={anterior}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[10px] bg-white text-plum shadow-pop transition hover:bg-ivory"
                >
                  <IconChevronLeft size={18} />
                </button>
                <button
                  onClick={siguiente}
                  aria-label="Siguiente imagen"
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[10px] bg-white text-plum shadow-pop transition hover:bg-ivory"
                >
                  <IconChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {imagenes.length > 1 && (
            <div className="mt-4 flex justify-center gap-1.5">
              {imagenes.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setIndice(i)}
                  aria-label={`Ir a la imagen ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === indice ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Categorías en círculos sobre una superficie curva (estructura de Malhu).
function Categorias({ categorias, cargando, fotos }) {
  if (!cargando && categorias.length === 0) return null;
  return (
    <section className="wood relative -mt-12 rounded-t-[50%_/_70px] pb-14 pt-16 md:-mt-16 md:rounded-t-[50%_/_110px] md:pt-24">
      {cargando ? (
        <div className="mx-auto max-w-6xl px-4">
          <SkeletonPills />
        </div>
      ) : (
        <div className="mx-auto flex max-w-6xl animate-fade-in flex-wrap justify-center gap-x-10 gap-y-10 px-4">
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              to={`/tienda?categoria=${cat.slug}`}
              className="group flex w-36 flex-col items-center text-center md:w-44"
            >
              <span className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-plum bg-lilac font-display text-5xl text-plum shadow-pop transition-transform duration-300 ease-out group-hover:scale-110 md:h-40 md:w-40">
                {cat.imagen_url || fotos[cat.slug] ? (
                  <ImagenOptimizada
                    src={cat.imagen_url || fotos[cat.slug]}
                    variante="thumb"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  cat.nombre.slice(0, 1)
                )}
              </span>
              <span className="mt-4 text-lg font-bold uppercase leading-tight text-plum-soft transition-colors group-hover:text-berry">
                {cat.nombre}
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-10 flex justify-center">
        <Link to="/tienda" className="btn !rounded-full bg-berry !px-8 !py-3.5 text-base text-white hover:bg-berry-dark">
          Ver toda la tienda
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const [categorias, setCategorias] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [fotos, setFotos] = useState({});
  // Mientras llegan los datos se muestran skeletons con la forma del contenido final.
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoDestacados, setCargandoDestacados] = useState(true);

  useEffect(() => {
    api
      .categorias()
      .then(setCategorias)
      .catch(() => {})
      .finally(() => setCargandoCategorias(false));
    api
      .productos({ destacado: "true", por_pagina: 8 })
      .then((data) => setDestacados(data.productos))
      .catch(() => {})
      .finally(() => setCargandoDestacados(false));
    api.promocionesActivas().then(setPromociones).catch(() => {});
    // Ofertas: franja propia arriba, porque suelen ser lo que más convierte.
    api
      .productos({ oferta: "true", por_pagina: 4 })
      .then((data) => setOfertas(data.productos))
      .catch(() => {});
    // Foto de respaldo de cada categoría sin imagen propia: se toma de uno de sus productos.
    api
      .productos({ por_pagina: 48 })
      .then((data) => {
        const mapa = {};
        for (const p of data.productos) {
          if (p.categoria && p.imagen_url && !mapa[p.categoria]) mapa[p.categoria] = p.imagen_url;
        }
        setFotos(mapa);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <Hero promociones={promociones} />
      <Categorias categorias={categorias} cargando={cargandoCategorias} fotos={fotos} />

      {/* Ofertas */}
      {ofertas.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl text-plum sm:text-3xl">Ofertas</h2>
            <Link to="/tienda?oferta=true" className="btn-secondary btn !py-2 text-xs">
              Ver todas
              <IconArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ofertas.map((producto, i) => (
              <ProductCard key={producto.id} producto={producto} indice={i} />
            ))}
          </div>
        </section>
      )}

      {/* Destacados */}
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl text-plum sm:text-3xl">Productos destacados</h2>
          <Link to="/tienda" className="btn-secondary btn !py-2 text-xs">
            Ver más
            <IconArrowRight size={14} />
          </Link>
        </div>
        {cargandoDestacados ? (
          <SkeletonProductGrid
            cantidad={8}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            etiqueta="Cargando productos destacados"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {destacados.map((producto, i) => (
              <ProductCard key={producto.id} producto={producto} indice={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
