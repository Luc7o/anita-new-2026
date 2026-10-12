import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconCheck, IconStar, IconHeart } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import SelectorRapido from "./SelectorRapido.jsx";

// `indice` (opcional) escalona la animación de entrada cuando la tarjeta
// aparece dentro de una grilla: cada tarjeta entra un poquito después de la
// anterior, en vez de todas de golpe.
export default function ProductCard({ producto, indice = 0 }) {
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
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

  // Comprar NO exige cuenta: el carrito funciona sin registrarse y el correo
  // se pide recién al pagar (ver Checkout). Solo los favoritos requieren cuenta.
  const handleComprar = async () => {
    if (necesitaOpciones) {
      navigate(`/producto/${producto.id}`);
      return;
    }
    setCargando(true);
    try {
      await agregar(producto.id);
      navigate("/checkout");
    } catch {
      // Sin stock u otro rechazo del servidor: llevamos a la ficha, donde se
      // ve el detalle y las opciones disponibles.
      navigate(`/producto/${producto.id}`);
    } finally {
      setCargando(false);
    }
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
      className="group flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-plum/10 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
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
            <span className="absolute left-3 top-3 rounded-full bg-berry px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Oferta
            </span>
          ) : producto.es_nuevo ? (
            <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-plum shadow-sm">
              Nuevo
            </span>
          ) : null}

          {producto.sin_stock && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-plum-soft backdrop-blur-sm">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-5 pb-0">
          <span className="text-xs uppercase tracking-wide text-plum-soft">Anita New Style</span>
          <h3 className="text-base font-semibold leading-snug text-plum">{producto.nombre}</h3>
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

      <div className="flex items-center justify-between px-5 pb-2.5 pt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-berry">S/{producto.precio_final.toFixed(2)}</span>
          {producto.tiene_oferta && (
            <span className="text-sm text-plum-soft line-through">S/{producto.precio.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleFavorito}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={esFavorito}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition hover:scale-110 active:scale-90 ${
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
        <div className="space-y-2 px-5 pb-5 pt-1">
          <button
            onClick={handleAgregar}
            disabled={agregando}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            aria-haspopup={necesitaOpciones ? "dialog" : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60 ${
              agregado
                ? "border-berry bg-berry text-white"
                : "border-berry text-berry hover:bg-berry/5"
            }`}
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
          <button
            onClick={handleComprar}
            disabled={cargando}
            aria-label={`Comprar ${producto.nombre}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-plum py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark active:scale-[0.97] disabled:opacity-60"
          >
            {cargando ? "Procesando..." : "Comprar"}
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
