import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { RotatingText, RotatingTextContainer } from "@animate-ui/react/primitives/texts/rotating";
import { ShimmeringText } from "@animate-ui/react/primitives/texts/shimmering";
import {
  Tabs,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from "@animate-ui/react/primitives/tabs";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import { SkeletonProductGrid } from "../components/Skeleton.jsx";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  IconTruck,
  IconStore,
  IconTag,
} from "../components/Icons.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import { urlVariante } from "../utils/imagenes.js";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";
import { MARCAS_TARJETA } from "../metodosPago.js";
import heroDefecto1 from "../assets/auth/login-hero.webp";
import heroDefecto2 from "../assets/auth/registro-hero.webp";

const IMAGENES_POR_DEFECTO = [heroDefecto1, heroDefecto2];
const FRASES_PORTADA = ["se nota.", "te define.", "te acompaña."];
// Color de respaldo de cada bloque de categoría mientras no tenga foto.
const FONDOS_CATEGORIA = ["#3a2a35", "#1f1e1c", "#7e2470", "#57534e", "#2f2d2a", "#4a1543"];

// Cada sección entra con un fundido corto la primera vez que aparece en pantalla.
// Con "reducir movimiento" Motion la deja quieta (ver AnimateUIProvider en main.jsx).
function Revelar({ children, className = "", retraso = 0 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: retraso }}
    >
      {children}
    </motion.div>
  );
}

// Foto de la portada. Usa la versión "lg" (1600 px, WebP) en vez del original,
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

function Hero({ promociones, oferta }) {
  // Solo promociones con imagen entran al carrusel; se mantiene el mismo orden
  // para que el índice siga apuntando a la promoción correcta.
  const slides = promociones.filter((p) => p.imagen_url);
  const hayPromos = slides.length > 0;
  const imagenes = hayPromos ? slides.map((p) => p.imagen_url) : IMAGENES_POR_DEFECTO;
  const [indice, setIndice] = useState(0);
  // El carrusel cambia el título y el botón principal: se detiene mientras la persona lo
  // mira (mouse o foco de teclado) o si pidió "reducir movimiento" en su sistema (WCAG 2.2.2).
  const [pausado, setPausado] = useState(false);
  const [reducirMovimiento, setReducirMovimiento] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => setIndice(0), [imagenes.length]);

  useEffect(() => {
    const consulta = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!consulta) return undefined;
    const alCambiar = (e) => setReducirMovimiento(e.matches);
    consulta.addEventListener?.("change", alCambiar);
    return () => consulta.removeEventListener?.("change", alCambiar);
  }, []);

  useEffect(() => {
    if (imagenes.length <= 1 || pausado || reducirMovimiento) return undefined;
    const id = setInterval(() => setIndice((i) => (i + 1) % imagenes.length), 5500);
    return () => clearInterval(id);
  }, [imagenes.length, pausado, reducirMovimiento]);

  const anterior = () => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  const siguiente = () => setIndice((i) => (i + 1) % imagenes.length);

  const promoActual = hayPromos ? slides[indice] : null;
  const esLinkExterno = promoActual?.boton_link?.startsWith("http");
  const segunda = imagenes[(indice + 1) % imagenes.length];

  return (
    <section
      className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-8 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-16"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
      }}
    >
      <div className="flex flex-col gap-6" aria-live={pausado || reducirMovimiento ? "polite" : "off"}>
        <p className="animate-fade-in-up text-xs font-bold uppercase tracking-[0.2em] text-berry">
          {promoActual ? promoActual.etiqueta || "Anita New Style" : "Nueva colección · Huancayo"}
        </p>
        <h1
          className="animate-fade-in-up font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] text-plum sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "100ms" }}
        >
          {promoActual ? (
            promoActual.titulo
          ) : (
            <>
              Estilo que
              <br />
              {reducirMovimiento ? (
                <span className="text-berry">{FRASES_PORTADA[0]}</span>
              ) : (
                <RotatingTextContainer text={FRASES_PORTADA} duration={2600} className="inline-block whitespace-nowrap pb-[0.14em] leading-[1.1] text-berry">
                  <RotatingText />
                </RotatingTextContainer>
              )}
            </>
          )}
        </h1>
        <p className="max-w-md animate-fade-in-up text-lg leading-relaxed text-plum-soft" style={{ animationDelay: "200ms" }}>
          {promoActual
            ? promoActual.descripcion
            : "Calzados, carteras, mochilas y accesorios seleccionados para tu día a día. Pide hoy y recíbelo en Huancayo."}
        </p>
        <div className="flex animate-fade-in-up flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
          {esLinkExterno ? (
            <a href={promoActual.boton_link} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-12! px-7!">
              {promoActual.boton_texto}
            </a>
          ) : (
            <Link to={promoActual ? promoActual.boton_link : "/tienda"} className="btn-primary min-h-12! px-7!">
              {promoActual ? promoActual.boton_texto : "Ver lo nuevo"}
            </Link>
          )}
          <a href="#categorias" className="btn-relleno">
            Explorar categorías
          </a>
        </div>
      </div>

      <div className="relative mx-auto h-[420px] w-full max-w-lg sm:h-[520px] md:max-w-none">
        <div className="flotar absolute right-0 top-0 h-[80%] w-[66%] overflow-hidden rounded-3xl bg-plum shadow-pop">
          {imagenes.map((url, i) => (
            <SlideHero key={url + i} url={url} visible={i === indice} />
          ))}
        </div>
        <div className="flotar-lento absolute bottom-0 left-0 h-[52%] w-[46%] overflow-hidden rounded-3xl bg-plum shadow-pop">
          <SlideHero key={segunda} url={segunda} visible />
        </div>
        {oferta && (
          <Link
            to={`/producto/${oferta.id}`}
            className="flotar absolute left-[4%] top-[8%] z-10 flex max-w-[60%] flex-col gap-1 rounded-2xl bg-plum px-4 py-3.5 text-ivory shadow-pop transition-transform hover:scale-[1.03]"
            style={{ animationDelay: "-1.5s" }}
          >
            <span className="text-[11px] font-bold tracking-[0.1em] text-berry-light">EN OFERTA</span>
            <span className="text-sm font-bold leading-snug">{oferta.nombre}</span>
            <span className="text-sm">
              S/ {oferta.precio_final.toFixed(2)}{" "}
              <s className="text-ivory/60">S/ {oferta.precio.toFixed(2)}</s>
            </span>
          </Link>
        )}
        {imagenes.length > 1 && (
          <div className="absolute bottom-3 right-3 z-10 flex gap-2">
            <button
              onClick={anterior}
              aria-label="Imagen anterior"
              className="icono-avance flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum shadow-pop transition hover:text-berry"
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              onClick={siguiente}
              aria-label="Siguiente imagen"
              className="icono-avance flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum shadow-pop transition hover:text-berry"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// Bloques grandes por categoría: foto (o color de respaldo) que hace zoom al pasar el mouse.
function Categorias({ categorias, cargando, fotos }) {
  if (!cargando && categorias.length === 0) return null;
  return (
    <section id="categorias" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-20 sm:px-8">
      <Revelar className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl text-plum sm:text-5xl">Compra por categoría</h2>
        <Link to="/tienda" className="subrayado font-bold text-berry">
          Ver toda la tienda
        </Link>
      </Revelar>
      {cargando ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-56 rounded-[20px] sm:h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categorias.map((cat, i) => {
            const foto = cat.imagen_url || fotos[cat.slug];
            return (
              <Revelar key={cat.id} retraso={i * 0.06}>
                <Link
                  to={`/tienda?categoria=${cat.slug}`}
                  className="bloque-cat relative flex h-56 items-end overflow-hidden rounded-[20px] p-5 text-ivory sm:h-72"
                >
                  <div className="bloque-fondo absolute inset-0" style={{ background: FONDOS_CATEGORIA[i % FONDOS_CATEGORIA.length] }}>
                    {foto && <ImagenOptimizada src={foto} variante="thumb" alt="" className="h-full w-full object-cover" />}
                  </div>
                  {foto && <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />}
                  <div className="relative flex w-full items-center justify-between gap-2">
                    <span className="font-display text-2xl font-extrabold sm:text-3xl">{cat.nombre}</span>
                    <span className="bloque-flecha text-2xl" aria-hidden="true">→</span>
                  </div>
                </Link>
              </Revelar>
            );
          })}
        </div>
      )}
    </section>
  );
}

// «Lo nuevo» con pestañas por categoría: el fondo de la pestaña activa se desliza (Animate UI Tabs).
function LoNuevo({ categorias }) {
  const [filtro, setFiltro] = useState("todo");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [reintentos, setReintentos] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(false);
    const params = { por_pagina: 8 };
    if (filtro !== "todo") params.categoria = filtro;
    api
      .productos(params)
      .then((data) => vigente && setProductos(data.productos))
      .catch(() => vigente && setError(true))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [filtro, reintentos]);

  const pestanas = [{ slug: "todo", nombre: "Todo" }, ...categorias.slice(0, 5)];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
      <Revelar className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-4xl text-plum sm:text-5xl">Lo nuevo</h2>
        {categorias.length > 0 && (
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsHighlight className="absolute inset-0 z-0 rounded-full bg-plum">
              <TabsList aria-label="Filtrar por categoría" className="flex flex-wrap gap-1 rounded-full bg-white p-1.5">
                {pestanas.map((p) => (
                  <TabsHighlightItem key={p.slug} value={p.slug}>
                    <TabsTrigger
                      value={p.slug}
                      className="relative z-10 min-h-11 rounded-full px-4 text-sm font-bold text-plum-soft transition-colors hover:text-plum data-[state=active]:text-ivory aria-selected:text-ivory"
                    >
                      {p.nombre}
                    </TabsTrigger>
                  </TabsHighlightItem>
                ))}
              </TabsList>
            </TabsHighlight>
          </Tabs>
        )}
      </Revelar>
      {cargando ? (
        <SkeletonProductGrid cantidad={8} className="grid grid-cols-2 gap-4 lg:grid-cols-4" etiqueta="Cargando lo nuevo" />
      ) : error ? (
        <p className="text-plum-soft" role="alert">
          No pudimos cargar los productos.{" "}
          <button type="button" onClick={() => setReintentos((n) => n + 1)} className="font-bold text-berry underline">
            Reintentar
          </button>
        </p>
      ) : productos.length === 0 ? (
        <p className="text-plum-soft">Todavía no hay productos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {productos.map((producto, i) => (
            <ProductCard key={producto.id} producto={producto} indice={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function Ofertas({ ofertas }) {
  if (ofertas.length === 0) return null;
  return (
    <section className="bg-plum py-20 text-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <Revelar className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-4xl sm:text-5xl">
            <ShimmeringText text="Ofertas de la semana" color="#f6f3ee" shimmeringColor="#e9a6dd" duration={2.5} />
          </h2>
          <Link to="/tienda?oferta=true" className="btn-relleno btn-relleno--claro">
            Ver todas
            <IconArrowRight size={16} />
          </Link>
        </Revelar>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {ofertas.map((producto, i) => (
            <div key={producto.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[23.5%]">
              <ProductCard producto={producto} indice={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Beneficios() {
  const items = [
    { Icono: IconTruck, titulo: "Delivery en Huancayo", texto: `S/ ${COSTO_ENVIO_DELIVERY.toFixed(2)} a cualquier distrito de la provincia.` },
    { Icono: IconStore, titulo: "Recojo en tienda gratis", texto: "Te avisamos con un código cuando tu pedido esté listo." },
    { Icono: IconTag, titulo: "Pago seguro", texto: `Yape o tarjeta ${MARCAS_TARJETA.join(" y ")}, procesado por Culqi.` },
  ];
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-20 sm:px-8 md:grid-cols-3">
      {items.map(({ Icono, titulo, texto }, i) => (
        <Revelar key={titulo} retraso={i * 0.08} className="flex items-start gap-4 rounded-[20px] bg-white p-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lilac text-berry">
            <Icono size={22} />
          </span>
          <div>
            <h3 className="font-sans text-lg font-bold tracking-normal text-plum">{titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-plum-soft">{texto}</p>
          </div>
        </Revelar>
      ))}
    </section>
  );
}

export default function Home() {
  const [categorias, setCategorias] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [fotos, setFotos] = useState({});
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  useEffect(() => {
    api
      .categorias()
      .then(setCategorias)
      .catch(() => {})
      .finally(() => setCargandoCategorias(false));
    api.promocionesActivas().then(setPromociones).catch(() => {});
    api
      .productos({ oferta: "true", por_pagina: 8 })
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
      <Hero promociones={promociones} oferta={ofertas[0]} />
      <Categorias categorias={categorias} cargando={cargandoCategorias} fotos={fotos} />
      <LoNuevo categorias={categorias} />
      <Ofertas ofertas={ofertas} />
      <Beneficios />
    </div>
  );
}
