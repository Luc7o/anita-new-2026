import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconCheck, IconStar, IconHeart } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import SelectorRapido from "./SelectorRapido.jsx";
import { nombreColorAHex } from "../utils/colores.js";

// `indice` (opcional) escalona la animación de entrada cuando la tarjeta
// aparece dentro de una grilla: cada tarjeta entra un poquito después de la
// anterior, en vez de todas de golpe.
// `compacto` (opcional) reduce espacios y textos para grillas de 5 por fila.
export default function ProductCard({ producto, indice = 0, compacto = false }) {
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();
  const navigate = useNavigate();
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
      navigate("/ingresar");
      return;
    }
    favoritos?.alternar(producto.id);
  };

  return (
    <div
      className="panel group flex animate-fade-in-up flex-col overflow-hidden transition-all duration-300 ease-out hover:z-10 hover:scale-[1.03] hover:border-berry hover:shadow-pop"
      style={{ animationDelay: `${Math.min(indice, 12) * 60}ms` }}
    >
      <Link to={`/producto/${producto.id}`} className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-berry">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-lilac">
          {producto.imagen_url ? (
            <ImagenOptimizada
              src={producto.imagen_url}
              variante="thumb"
              alt={producto.nombre}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-berry-light/60">
              {producto.nombre.slice(0, 1)}
            </div>
          )}

          {producto.tiene_oferta ? (
            <span className="absolute left-3 top-3 rounded-md bg-berry px-2 py-1 text-xs font-semibold text-white">
              Oferta
            </span>
          ) : producto.es_nuevo ? (
            <span className="absolute left-3 top-3 rounded-md bg-plum px-2 py-1 text-xs font-semibold text-white">
              Nuevo
            </span>
          ) : null}

          {producto.sin_stock && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-plum-soft backdrop-blur-sm">
              Agotado
            </span>
          )}
        </div>

        <div className={`flex flex-1 flex-col gap-1.5 pb-0 ${compacto ? "p-3" : "p-5"}`}>
          <span className="text-xs uppercase tracking-wide text-plum-soft">Anita New Style</span>
          <h3 className={`font-semibold leading-snug text-plum ${compacto ? "text-sm" : "text-base"}`}>{producto.nombre}</h3>
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
              <IconStar size={13} relleno className="text-gold" />
              <span className="text-xs text-plum-soft">
                {producto.promedio_calificacion} ({producto.total_resenas})
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className={`flex items-center justify-between gap-2 ${compacto ? "px-3 pb-2 pt-1.5" : "px-5 pb-2.5 pt-2"}`}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={`font-display font-bold text-plum ${compacto ? "text-lg" : "text-xl"}`}>S/{producto.precio_final.toFixed(2)}</span>
          {producto.tiene_oferta && (
            <span className={`text-plum-soft line-through ${compacto ? "text-xs" : "text-sm"}`}>S/{producto.precio.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleFavorito}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={esFavorito}
          className={`flex shrink-0 items-center justify-center rounded-full border transition hover:scale-110 active:scale-90 ${compacto ? "h-9 w-9" : "h-11 w-11"} ${
            esFavorito ? "border-berry bg-berry text-white" : "border-plum/15 text-plum-soft hover:text-berry"
          }`}
        >
          {/* key: al cambiar de estado el ícono se vuelve a montar y repite el "pop" */}
          <span key={esFavorito ? "si" : "no"} className={`flex ${esFavorito ? "animate-pop" : ""}`}>
            <IconHeart size={14} relleno={esFavorito} />
          </span>
        </button>
      </div>

      {!producto.sin_stock && (
        <div className={`space-y-2 pt-1 ${compacto ? "px-3 pb-3" : "px-5 pb-5"}`}>
          <button
            onClick={handleAgregar}
            disabled={agregando}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            aria-haspopup={necesitaOpciones ? "dialog" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-[10px] border py-2.5 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60 ${agregado ? "border-plum bg-plum text-white" : "border-berry bg-berry text-white hover:border-berry-dark hover:bg-berry-dark"}`}
          >
            {agregado ? (
              <span className="flex animate-pop">
                <IconCheck size={14} />
              </span>
            ) : (
              <IconCart size={14} />
            )}
            {agregando ? "Agregando..." : agregado ? "¡Agregado!" : "Agregar al carrito"}
          </button>
          {errorRapido && (
            <p className="text-xs text-berry-dark" role="alert">
              {errorRapido}
            </p>
          )}
          <span className="sr-only" role="status">
            {agregado ? `${producto.nombre} agregado al carrito` : ""}
          </span>
        </div>
      )}

      {selectorAbierto && (
        <SelectorRapido
          producto={producto}
          onClose={() => setSelectorAbierto(false)}
          onAgregado={alAgregarDesdeSelector}
        />
      )}
    </div>
  );
}
