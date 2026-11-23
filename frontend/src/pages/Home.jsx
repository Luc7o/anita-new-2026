import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
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
  IconTag,
  IconCart,
  IconStore,
  IconWhatsApp,
} from "../components/Icons.jsx";
import EtiquetaOferta from "../components/EtiquetaOferta.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import { urlVariante } from "../utils/imagenes.js";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";
import { MARCAS_TARJETA } from "../metodosPago.js";
import { armarLinkWhatsApp } from "../whatsapp.js";
import heroDefecto1 from "../assets/auth/login-hero.webp";
import heroDefecto2 from "../assets/auth/registro-hero.webp";
import { AnimateIcon } from "@animate-ui/react/icons";
import { useMetadatos } from "../hooks/useMetadatos";

const IMAGENES_POR_DEFECTO = [heroDefecto1, heroDefecto2];
// Color de respaldo de cada bloque de categoría mientras no tenga foto.
const FONDOS_CATEGORIA = ["#2a272c", "#1c1a1d", "#4a454e", "#5c5660", "#38343b", "#24212a"];

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
      className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-10 sm:px-8 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pb-16 md:pt-12"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
      }}
    >
      <div className="flex flex-col" aria-live={pausado || reducirMovimiento ? "polite" : "off"}>
        {promoActual?.etiqueta && <span className="aviso-fino mb-5 self-start">{promoActual.etiqueta}</span>}
        <h1
          className="animate-fade-in-up text-[clamp(3rem,6vw,5.8rem)] leading-[0.98] text-plum"
          style={{ animationDelay: "80ms" }}
        >
          {promoActual ? (
            promoActual.titulo
          ) : (
            <>
              Moda elegida en <em className="text-berry">Huancayo</em>
            </>
          )}
        </h1>
        <p className="mt-6 max-w-[34ch] animate-fade-in-up text-[19px] leading-relaxed text-plum-soft" style={{ animationDelay: "160ms" }}>
          {promoActual
            ? promoActual.descripcion
            : "Carteras, calzado y accesorios elegidos pieza por pieza. Recógelos en la tienda o recíbelos en tu casa."}
        </p>
        <div className="mt-7 flex animate-fade-in-up flex-wrap items-center gap-5" style={{ animationDelay: "240ms" }}>
          {esLinkExterno ? (
            <a href={promoActual.boton_link} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-12!">
              {promoActual.boton_texto}
            </a>
          ) : (
            <Link to={promoActual ? promoActual.boton_link : "/tienda"} className="btn-primary min-h-12!">
              {promoActual ? promoActual.boton_texto : "Ver lo nuevo"}
            </Link>
          )}
          <span className="aviso-fino">Recojo gratis en tienda</span>
        </div>
        <p className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-plum">
          <span className="inline-flex items-center gap-2">
            <IconTruck size={16} /> Delivery en Huancayo S/ {COSTO_ENVIO_DELIVERY.toFixed(2)}
          </span>
          <span className="inline-flex items-center gap-2">
            <IconTag size={16} /> Paga con tarjeta o Yape
          </span>
        </p>
      </div>

      <figure className="relative m-0">
        <div className="relative aspect-5/6 overflow-hidden rounded-md bg-[#ecebee]">
          {imagenes.map((url, i) => (
            <SlideHero key={url + i} url={url} visible={i === indice} />
          ))}
          <span className="aviso-fino absolute left-4 top-4 z-10">Nuevo esta semana</span>
          {imagenes.length > 1 && (
            <div className="absolute bottom-3 left-3 z-10 flex gap-2">
              <AnimateIcon animateOnHover animateOnTap asChild>
                <button
                  onClick={anterior}
                  aria-label="Imagen anterior"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum transition hover:bg-plum hover:text-ivory"
                >
                  <IconChevronLeft size={18} />
                </button>
              </AnimateIcon>
              <AnimateIcon animateOnHover animateOnTap asChild>
                <button
                  onClick={siguiente}
                  aria-label="Siguiente imagen"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum transition hover:bg-plum hover:text-ivory"
                >
                  <IconChevronRight size={18} />
                </button>
              </AnimateIcon>
            </div>
          )}
        </div>
        {oferta && (
          <div className="mt-3.5 grid gap-2 bg-white p-[18px] shadow-[inset_0_0_0_2px_rgb(var(--c-plum))] md:absolute md:-right-4 md:bottom-6 md:mt-0 md:w-[340px]">
            <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
              <div className="foto-vacia h-20 w-16 overflow-hidden rounded">
                {oferta.imagen_url && (
                  <ImagenOptimizada src={oferta.imagen_url} variante="thumb" alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="grid gap-1">
                <span className="font-display text-[22px] font-bold leading-[1.15] text-plum">{oferta.nombre}</span>
                {oferta.categoria_nombre && <span className="text-sm text-plum-soft">{oferta.categoria_nombre}</span>}
              </div>
            </div>
            <div className="mb-2 flex items-start gap-[18px]">
              <EtiquetaOferta precio={oferta.precio_final} antes={oferta.precio} />
              <p className="pt-11 text-sm leading-normal text-plum-soft">
                Ahorras <b className="font-extrabold text-plum">S/ {(oferta.precio - oferta.precio_final).toFixed(2)}</b>
                <br />
                Recojo gratis en tienda
              </p>
            </div>
            <Link to={`/producto/${oferta.id}`} className="btn-primary w-full">
              <IconCart size={16} /> Ver y agregar
            </Link>
          </div>
        )}
      </figure>
    </section>
  );
}

// Bloques grandes por categoría: foto (o color de respaldo) que hace zoom al pasar el mouse.
function Categorias({ categorias, cargando, fotos }) {
  if (!cargando && categorias.length === 0) return null;
  return (
    <section id="categorias" className="regla mx-auto max-w-7xl scroll-mt-28 px-4 pb-18 pt-14 sm:px-8">
      <Revelar className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">Compra por categoría</h2>
        <Link to="/tienda" className="subrayado font-bold text-plum">
          Ver toda la tienda
        </Link>
      </Revelar>
      {cargando ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-56 rounded-md sm:h-72" />
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
                  className="bloque-cat relative flex h-56 items-end overflow-hidden rounded-md p-5 text-white sm:h-72"
                >
                  <div className="bloque-fondo absolute inset-0" style={{ background: FONDOS_CATEGORIA[i % FONDOS_CATEGORIA.length] }}>
                    {foto && <ImagenOptimizada src={foto} variante="thumb" alt="" className="h-full w-full object-cover" />}
                  </div>
                  {foto && <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />}
                  <div className="relative flex w-full items-center justify-between gap-2">
                    <span className="font-display text-2xl font-bold sm:text-3xl">{cat.nombre}</span>
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
    <section className="regla mx-auto max-w-7xl px-4 pb-18 pt-14 sm:px-8">
      <Revelar className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">Lo nuevo de la semana</h2>
        {categorias.length > 0 && (
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsHighlight className="absolute inset-0 z-0 rounded-full bg-plum">
              <TabsList aria-label="Filtrar por categoría" className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-[inset_0_0_0_1px_rgb(var(--c-plum)/0.2)]">
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
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
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
    <section className="regla mx-auto max-w-7xl px-4 pb-18 pt-14 sm:px-8">
      <div>
        <Revelar className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">
            Ofertas <em>de la semana</em>
          </h2>
          <AnimateIcon animateOnHover animateOnTap asChild>
            <Link to="/tienda?oferta=true" className="btn-secondary">
              Ver todas
              <IconArrowRight size={16} />
            </Link>
          </AnimateIcon>
        </Revelar>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-3 sm:mx-0 sm:px-0">
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

// «Comprar aquí es como comprar en la tienda»: título a la izquierda y cuatro pasos con su costo.
function ComoComprar() {
  const linkWhatsApp = armarLinkWhatsApp("Hola, tengo una duda sobre un producto");
  const pasos = [
    { Icono: IconCart, titulo: "Elige y agrega a tu bolsa", texto: "Ves el total con la entrega antes de pagar.", costo: "" },
    { Icono: IconTag, titulo: "Paga con tarjeta o Yape", texto: `${MARCAS_TARJETA.join(", ")} o Yape, procesados por Culqi.`, costo: "" },
    { Icono: IconStore, titulo: "Recógelo en la tienda", texto: "Con tu código de 6 dígitos y tu DNI.", costo: "Gratis" },
    { Icono: IconTruck, titulo: "O recíbelo en tu casa", texto: "Delivery dentro de Huancayo.", costo: `S/ ${COSTO_ENVIO_DELIVERY.toFixed(2)}` },
  ];
  return (
    <section className="regla mx-auto grid max-w-7xl gap-7 px-4 pb-18 pt-14 sm:px-8 md:grid-cols-[0.9fr_1.2fr] md:gap-16">
      <Revelar className="grid content-start gap-4 md:sticky md:top-28">
        <h2 className="text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">
          Comprar aquí es como comprar <em>en la tienda</em>
        </h2>
        <p className="max-w-[38ch] text-[17px] text-plum-soft">
          La misma pieza, el mismo precio y la misma atención. Solo que la eliges desde tu celular.
        </p>
        {linkWhatsApp && (
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2.5 font-bold text-plum underline decoration-1 underline-offset-4"
        >
          <IconWhatsApp size={18} /> ¿Dudas con una talla o un color? Escríbenos por WhatsApp
        </a>
        )}
      </Revelar>
      <ol className="regla m-0 list-none p-0">
        {pasos.map(({ Icono, titulo, texto, costo }) => (
          <li
            key={titulo}
            className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-[18px] gap-y-1 border-b border-plum/15 py-[22px] sm:grid-cols-[48px_minmax(0,1fr)_auto]"
          >
            <span className="ico-redondo h-10! w-10! text-plum sm:h-12! sm:w-12!">
              <Icono size={20} />
            </span>
            <span className="grid gap-1">
              <b className="text-lg text-plum">{titulo}</b>
              <span className="text-[15px] text-plum-soft">{texto}</span>
            </span>
            {costo && <span className="precio col-start-2 whitespace-nowrap text-[17px] text-plum sm:col-start-3">{costo}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

// Campaña: foto real de la tienda y las categorías como enlaces.
function Campana({ categorias }) {
  const lista = categorias.slice(0, 4);
  return (
    <section className="grid bg-plum/5 md:grid-cols-2">
      <div className="aspect-4/3 overflow-hidden md:aspect-auto md:min-h-[560px]">
        <img src={heroDefecto2} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      <Revelar className="flex max-w-[600px] flex-col justify-center gap-[22px] px-4 py-14 sm:px-8 md:px-12">
        <h2 className="text-[clamp(2.2rem,3.6vw,3.2rem)] leading-none text-plum">
          Para el día a día <em className="block">y para la ocasión</em>
        </h2>
        <p className="text-plum-soft">Carteras que van con todo, calzado cómodo y los accesorios que terminan el look.</p>
        {lista.length > 0 && (
          <ul className="regla m-0 list-none p-0">
            {lista.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/tienda?categoria=${cat.slug}`}
                  className="group flex min-h-14 items-center justify-between border-b border-plum/15 font-display text-[19px] font-bold text-plum transition-[padding] duration-300 hover:pl-2"
                >
                  <span>{cat.nombre}</span>
                  <IconArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="flex flex-wrap items-center gap-3 text-[15px] text-plum">
          <span className="aviso-fino">Recojo gratis</span>
          Pídelo en línea y recógelo en nuestra tienda de Huancayo.
        </p>
      </Revelar>
    </section>
  );
}

export default function Home() {
  useMetadatos();
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
      <ComoComprar />
      <Campana categorias={categorias} />
    </div>
  );
}
