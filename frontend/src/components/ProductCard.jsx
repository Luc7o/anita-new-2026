import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RippleButton, RippleButtonRipples } from "@animate-ui/react/primitives/buttons/ripple";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconCheck, IconStar, IconHeart } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import SelectorRapido from "./SelectorRapido.jsx";
import EtiquetaOferta from "./EtiquetaOferta.jsx";
import { nombreColorAHex } from "../utils/colores.js";
import { useToast } from "../context/ToastContext.jsx";
import { AnimateIcon } from "@animate-ui/react/icons";

// Tarjeta de producto «Anita, elegida»: la foto enmarcada sin tarjeta alrededor, el aviso fino
// «Nuevo» o «Quedan N» sobre la foto, la etiqueta kraft colgando si está en oferta y «Agregar»
// que entra desde abajo (en el celular queda siempre visible, ver .tarjeta-rapido en theme.css).
// `indice` (opcional) escalona la animación de entrada dentro de una grilla.
// `compacto` (opcional) reduce espacios y textos para grillas de 5 por fila.
export default function ProductCard({ producto, indice = 0, compacto = false }) {
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();
  const navigate = useNavigate();
  const toast = useToast();
  const [agregando, setAgregando] = useState(false);
  const [agregado, setAgregado] = useState(false);
  const [errorRapido, setErrorRapido] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const temporizadores = useRef([]);

  useEffect(
    () => () => temporizadores.current.forEach((t) => clearTimeout(t)),
    []
  );
  const despuesDe = (ms, fn) => temporizadores.current.push(setTimeout(fn, ms));

  const necesitaOpciones =
    (producto.tallas && producto.tallas.length > 0) || (producto.colores && producto.colores.length > 0);

  const esFavorito = favoritos?.esFavorito(producto.id);
  const pocas = !producto.sin_stock && producto.stock > 0 && producto.stock <= 3;

  const marcarAgregado = () => {
    setAgregado(true);
    despuesDe(1800, () => setAgregado(false));
  };

  // "Agregar al carrito" con atajo: si el producto tiene tallas/colores, abre
  // el selector rápido para elegirlos sin salir del listado; si no tiene
  // opciones, lo agrega de inmediato. No exige cuenta (ver Checkout).
  const handleAgregar = async () => {
    setErrorRapido("");
    if (necesitaOpciones) {
      setSelectorAbierto(true);
      return;
    }
    setAgregando(true);
    try {
      await agregar(producto.id, { abrirCarrito: false });
      marcarAgregado();
    } catch (err) {
      setErrorRapido(err.message);
      despuesDe(4000, () => setErrorRapido(""));
    } finally {
      setAgregando(false);
    }
  };

  const alAgregarDesdeSelector = () => {
    setSelectorAbierto(false);
    marcarAgregado();
  };

  const handleFavorito = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!usuario) {
      toast.info("Inicia sesión para guardar tus favoritos");
      navigate("/ingresar");
      return;
    }
    favoritos?.alternar(producto.id);
  };

  return (
    <article
      className="tarjeta group relative flex animate-fade-in-up flex-col"
      style={{ animationDelay: `${Math.min(indice, 12) * 60}ms` }}
    >
      <div className="relative">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-md bg-[#ecebee]">
        <Link
          to={`/producto/${producto.id}`}
          className="block h-full w-full focus:outline-hidden"
          aria-label={producto.nombre}
          tabIndex={-1}
        >
          {producto.imagen_url ? (
            <ImagenOptimizada
              src={producto.imagen_url}
              variante="thumb"
              alt={producto.nombre}
              className="tarjeta-foto h-full w-full object-cover"
            />
          ) : (
            <div className="tarjeta-foto foto-vacia flex h-full w-full items-center justify-center">
              <span className="font-display text-5xl font-extrabold text-plum/15">{producto.nombre.slice(0, 1)}</span>
            </div>
          )}
        </Link>

        {pocas ? (
          <span className="aviso-fino aviso-m absolute bottom-3 left-3">Quedan {producto.stock}</span>
        ) : producto.es_nuevo ? (
          <span className="aviso-fino absolute bottom-3 left-3">Nuevo</span>
        ) : null}

        <AnimateIcon animateOnHover animateOnTap asChild>
          <button
            onClick={handleFavorito}
            aria-label={esFavorito ? `Quitar ${producto.nombre} de favoritos` : `Agregar ${producto.nombre} a favoritos`}
            aria-pressed={esFavorito}
            className="absolute left-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-plum transition-colors hover:bg-white"
          >
            {/* key: al cambiar de estado el ícono se vuelve a montar y repite el "pop" */}
            <span key={esFavorito ? "si" : "no"} className={`flex ${esFavorito ? "animate-pop" : ""}`}>
              <IconHeart size={18} relleno={esFavorito} />
            </span>
          </button>
        </AnimateIcon>

        {producto.sin_stock ? (
          <span className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 py-2.5 text-center text-sm font-bold text-plum-soft">
            Agotado
          </span>
        ) : (
          <div className="tarjeta-rapido absolute inset-x-3 bottom-3">
            <AnimateIcon animateOnHover animateOnTap asChild>
              <RippleButton
                onClick={handleAgregar}
                disabled={agregando}
                aria-label={`Agregar ${producto.nombre} al carrito`}
                aria-haspopup={necesitaOpciones ? "dialog" : undefined}
                className="flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-plum text-xs font-extrabold uppercase tracking-[0.1em] text-ivory transition-colors hover:bg-black disabled:opacity-60 [--ripple-button-ripple-color:rgba(255,255,255,0.35)]"
              >
                {agregado ? (
                  <span className="flex animate-pop">
                    <IconCheck size={15} animate />
                  </span>
                ) : (
                  <IconCart size={15} />
                )}
                {agregando ? "Agregando..." : agregado ? "¡Agregado!" : necesitaOpciones ? "Elegir talla" : "Agregar"}
                <RippleButtonRipples />
              </RippleButton>
            </AnimateIcon>
          </div>
        )}
      </div>
      {producto.tiene_oferta && (
        <EtiquetaOferta
          chica
          precio={producto.precio_final}
          antes={producto.precio}
          className="pointer-events-none absolute -top-1 right-2 z-10 sm:right-3"
        />
      )}
      </div>

      <Link
        to={`/producto/${producto.id}`}
        className={`flex flex-1 flex-col gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-berry ${compacto ? "pt-2.5" : "pt-3"}`}
      >
        {producto.categoria_nombre && (
          <span className="text-[13px] text-plum-soft">{producto.categoria_nombre}</span>
        )}
        <h3 className={`font-sans font-bold leading-snug tracking-normal text-plum ${compacto ? "text-sm" : "text-[15px]"}`}>
          {producto.nombre}
        </h3>
        {producto.colores && producto.colores.length > 0 && (
          <div className="flex items-center gap-1.5" aria-label={`Colores: ${producto.colores.join(", ")}`}>
            {producto.colores.slice(0, 5).map((c) => (
              <span
                key={c}
                title={c}
                className="h-3.5 w-3.5 rounded-full border border-plum/20"
                style={{ backgroundColor: nombreColorAHex(c) }}
              />
            ))}
            {producto.colores.length > 5 && (
              <span className="text-xs text-plum-soft">+{producto.colores.length - 5}</span>
            )}
          </div>
        )}
        {producto.total_resenas > 0 && (
          <div className="flex items-center gap-1">
            <IconStar size={13} relleno className="text-plum" />
            <span className="text-xs text-plum-soft">
              {producto.promedio_calificacion} ({producto.total_resenas})
            </span>
          </div>
        )}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <span className={`precio text-plum ${compacto ? "text-base" : "text-[17px]"}`}>
            S/ {producto.precio_final.toFixed(2)}
          </span>
          {producto.tiene_oferta && (
            <span className={`text-plum-soft line-through ${compacto ? "text-xs" : "text-sm"}`}>S/ {producto.precio.toFixed(2)}</span>
          )}
        </p>
      </Link>

      {errorRapido && (
        <p className="px-4 pb-3 text-xs font-semibold text-berry-dark" role="alert">
          {errorRapido}
        </p>
      )}
      <span className="sr-only" role="status">
        {agregado ? `${producto.nombre} agregado al carrito` : ""}
      </span>

      {selectorAbierto && (
        <SelectorRapido
          producto={producto}
          onClose={() => setSelectorAbierto(false)}
          onAgregado={alAgregarDesdeSelector}
        />
      )}
    </article>
  );
}
