import { useToast } from "../context/ToastContext.jsx";
import Spinner from "../components/Spinner.jsx";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useFavoritos } from "../context/FavoritosContext.jsx";
import { IconCart, IconHeart, IconSearch, IconArrowRight } from "../components/Icons.jsx";
import { AnimatePresence, motion } from "motion/react";
import { RippleButton, RippleButtonRipples } from "@animate-ui/react/primitives/buttons/ripple";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";
import Estrellas from "../components/Estrellas.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import VisorImagen from "../components/VisorImagen.jsx";
import {
  SkeletonDetalleProducto,
  SkeletonResenas,
  SkeletonCarruselRelacionados,
} from "../components/Skeleton.jsx";
import { nombreColorAHex } from "../utils/colores.js";
import { METODOS_PAGO_TIENDA } from "../metodosPago.js";

export default function ProductoDetalle() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { agregar } = useCarrito();
  const favoritos = useFavoritos();

  const [producto, setProducto] = useState(null);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(null);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [resenas, setResenas] = useState([]);
  const [miCalificacion, setMiCalificacion] = useState(0);
  const [miComentario, setMiComentario] = useState("");
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [errorResena, setErrorResena] = useState("");
  const [productosRelacionados, setProductosRelacionados] = useState([]);
  // Banderas de carga: mientras llegan reseñas / relacionados se muestran
  // skeletons en vez de mensajes engañosos ("sé la primera en reseñar...").
  const [cargandoResenas, setCargandoResenas] = useState(true);
  const [cargandoRelacionados, setCargandoRelacionados] = useState(true);
  const [errorProducto, setErrorProducto] = useState(false);
  const refCarrusel = useRef(null);

  const cargarResenas = () =>
    api
      .resenas(id)
      .then((data) => setResenas(data.resenas))
      .finally(() => setCargandoResenas(false));

  useEffect(() => {
    cargarResenas();
  }, [id]);

  useEffect(() => {
    if (!usuario) return;
    const propia = resenas.find((r) => r.usuario_id === usuario.id);
    if (propia) {
      setMiCalificacion(propia.calificacion);
      setMiComentario(propia.comentario || "");
    }
  }, [resenas, usuario]);

  const enviarResena = async (e) => {
    e.preventDefault();
    if (!usuario) {
      navigate("/ingresar");
      return;
    }
    if (miCalificacion < 1) {
      setErrorResena("Elige al menos una estrella.");
      return;
    }
    setEnviandoResena(true);
    setErrorResena("");
    try {
      await api.guardarResena(id, { calificacion: miCalificacion, comentario: miComentario });
      cargarResenas();
      toast.success("¡Gracias! Tu reseña se guardó");
    } catch (err) {
      setErrorResena(err.message);
    } finally {
      setEnviandoResena(false);
    }
  };

  useEffect(() => {
    api.producto(id).then((data) => {
      setProducto(data);
      api.registrarEvento("vista_producto", { productoId: data.id });
      // La talla no se preselecciona: el cliente debe elegirla a propósito.
      // El color sí queda preseleccionado con el primero, porque es el que
      // corresponde a la imagen que se muestra al entrar.
      setTalla("");
      setColor(data.colores?.[0] || "");
      const primera = data.imagenes?.[0]?.url || data.imagen_url;
      setImagenActiva(primera);

      // Cargar productos relacionados (misma categoría). Se piden más de
      // los que caben en pantalla a propósito, para que el carrusel tenga
      // sentido (si no, las flechas no tendrían nada más que mostrar).
      if (data?.categoria_id) {
        api.productos({ categoria_id: data.categoria_id, por_pagina: 12 })
          .then((response) => {
            const filtrados = response.productos.filter(p => p.id !== data.id);
            setProductosRelacionados(filtrados);
          })
          .catch(() => {})
          .finally(() => setCargandoRelacionados(false));
      } else {
        setCargandoRelacionados(false);
      }
    }).catch(() => setErrorProducto(true));
  }, [id]);

  // Disponibilidad de una talla/color para habilitar o no su botón.
  // Si la OTRA dimensión ya está elegida, exige esa combinación exacta
  // (como antes). Si la otra dimensión todavía no está elegida, alcanza con
  // que exista AL MENOS una variante con esta talla/color (sin importar la
  // otra) que tenga stock — así ningún botón queda bloqueado solo porque
  // el cliente todavía no eligió el otro campo.
  const tallaDisponible = (t) => {
    if (!producto.usa_variantes) return true;
    if (color) return stockParaCombo(t, color) > 0;
    return (producto.variantes || []).some((v) => (v.talla || null) === (t || null) && v.stock > 0);
  };

  const colorDisponible = (c) => {
    if (!producto.usa_variantes) return true;
    if (talla) return stockParaCombo(talla, c) > 0;
    return (producto.variantes || []).some((v) => (v.color || null) === (c || null) && v.stock > 0);
  };

  // Stock disponible para una combinación de talla/color. Si el producto no
  // usa variantes, el stock es el mismo sin importar lo elegido.
  const stockParaCombo = (t, c) => {
    if (!producto || !producto.usa_variantes) return producto?.stock ?? 0;
    const tallaBuscada = producto.tallas?.length ? t : null;
    const colorBuscado = producto.colores?.length ? c : null;
    const variante = producto.variantes?.find(
      (v) => (v.talla || null) === (tallaBuscada || null) && (v.color || null) === (colorBuscado || null)
    );
    return variante ? variante.stock : 0;
  };

  useEffect(() => {
    if (!producto || !color) return;
    const imagenDelColor = producto.imagenes?.find((img) => img.color === color);
    if (imagenDelColor) {
      setImagenActiva(imagenDelColor.url);
    }
  }, [color, producto]);

  useEffect(() => {
    if (!producto) return;
    const disponible = stockParaCombo(talla, color);
    if (disponible > 0 && cantidad > disponible) {
      setCantidad(disponible);
    }
  }, [talla, color, producto]);

  if (!producto) {
    if (errorProducto) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-lg font-semibold text-plum">No encontramos este producto.</p>
          <Link
            to="/tienda"
            className="mt-4 inline-block rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
          >
            Ver la tienda
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <SkeletonDetalleProducto />
      </div>
    );
  }

  // Falta elegir talla y/o color: solo aplica si el producto realmente
  // ofrece esas opciones (algunos productos no tienen tallas ni colores).
  const faltaTalla = producto.tallas?.length > 0 && !talla;
  const faltaColor = producto.colores?.length > 0 && !color;
  const seleccionIncompleta = faltaTalla || faltaColor;

  const stockSeleccion = seleccionIncompleta ? 0 : stockParaCombo(talla, color);
  // "Sin stock" solo se muestra cuando la selección YA está completa pero
  // esa combinación específica no tiene stock — si todavía falta elegir,
  // el mensaje correcto es pedir que elija, no decir que no hay stock.
  const sinStockEnCombo = !seleccionIncompleta && producto.usa_variantes && stockSeleccion <= 0;
  const esFavorito = favoritos?.esFavorito(producto.id);
  const descuento = producto.tiene_oferta ? Math.round((1 - producto.precio_final / producto.precio) * 100) : 0;

  const textoBotonPendiente = () => {
    if (faltaTalla && faltaColor) return "Elige talla y color";
    if (faltaTalla) return "Elige una talla";
    if (faltaColor) return "Elige un color";
    return null;
  };

  const handleFavorito = () => {
    if (!usuario) {
      toast.info("Inicia sesión para guardar tus favoritos");
      navigate("/ingresar");
      return;
    }
    favoritos?.alternar(producto.id);
  };

  // Agregar y comprar NO exigen cuenta: el carrito funciona sin registrarse y
  // el correo se pide recién al pagar (ver Checkout).
  const handleAgregar = async () => {
    setAgregando(true);
    setMensaje("");
    try {
      await agregar(producto.id, { cantidad, talla, color });
      api.registrarEvento("agregar_carrito", { productoId: producto.id, metadata: { cantidad } });
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setAgregando(false);
    }
  };

  const handleComprar = async () => {
    setAgregando(true);
    setMensaje("");
    try {
      // abrirCarrito: false: "Comprar ahora" va directo al checkout, sin abrir el carrito.
      await agregar(producto.id, { cantidad, talla, color, abrirCarrito: false, avisar: false });
      api.registrarEvento("agregar_carrito", { productoId: producto.id, metadata: { cantidad, via: "comprar_ahora" } });
      navigate("/checkout");
    } catch (err) {
      setMensaje(err.message);
      setAgregando(false);
    }
  };

  // Mueve el carrusel de "También te puede interesar" hacia la izquierda
  // (-1) o derecha (1), desplazando el 80% del ancho visible por clic.
  const scrollCarrusel = (direccion) => {
    if (!refCarrusel.current) return;
    const ancho = refCarrusel.current.clientWidth * 0.8;
    refCarrusel.current.scrollBy({ left: direccion * ancho, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl animate-fade-in px-6 pb-16">
      {visorAbierto && imagenActiva && (
        <VisorImagen
          imagenes={producto.imagenes?.length ? producto.imagenes : [{ id: "unica", url: imagenActiva }]}
          indiceInicial={Math.max(0, (producto.imagenes || []).findIndex((img) => img.url === imagenActiva))}
          nombre={producto.nombre}
          onClose={() => setVisorAbierto(false)}
        />
      )}
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 py-6 text-sm text-plum-soft">
        <Link to="/" className="hover:text-berry">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link to="/tienda" className="hover:text-berry">Tienda</Link>
        {producto.categoria && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/tienda?categoria=${producto.categoria}`} className="hover:text-berry">{producto.categoria_nombre}</Link>
          </>
        )}
      </nav>
      <div className="grid items-start gap-10 md:grid-cols-2 lg:gap-14">
        {/* Galería: en mobile, la imagen grande arriba y las miniaturas debajo
            en fila horizontal (flex-col-reverse muestra el último hijo del DOM
            primero). Desde md hacia arriba, flex-row pone las miniaturas
            (primer hijo del DOM) a la izquierda de la imagen grande. */}
        <div className="flex flex-col-reverse gap-3 md:sticky md:top-28 md:flex-row md:gap-4">
          {producto.imagenes?.length > 1 && (
            <div
              className="flex gap-2.5 overflow-x-auto pb-1 md:max-h-[600px] md:w-22 md:shrink-0 md:flex-col md:overflow-x-visible md:overflow-y-auto md:pb-0"
              role="group"
              aria-label="Otras fotos del producto"
            >
              {producto.imagenes.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setImagenActiva(img.url)}
                  aria-label={`Ver foto${img.color ? ` — color ${img.color}` : ""}`}
                  aria-pressed={imagenActiva === img.url}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 ${
                    imagenActiva === img.url ? "border-plum" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <ImagenOptimizada src={img.url} variante="thumb" alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="relative aspect-4/5 flex-1 overflow-hidden rounded-3xl bg-[#ece7e0]">
            {imagenActiva ? (
              <button
                type="button"
                onClick={() => setVisorAbierto(true)}
                aria-label="Ampliar imagen"
                className="group relative block h-full w-full cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-berry"
              >
                {/* La foto nueva entra con un fundido y un leve zoom al cambiar de miniatura. */}
                <AnimatePresence initial={false}>
                  <motion.div
                    key={imagenActiva}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ImagenOptimizada
                      src={imagenActiva}
                      variante="med"
                      prioridad
                      alt={producto.nombre}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </motion.div>
                </AnimatePresence>
                <span
                  className="pointer-events-none absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-plum shadow-pop"
                  aria-hidden="true"
                >
                  <IconSearch size={17} />
                </span>
              </button>
            ) : (
              <div className="foto-vacia flex h-full items-center justify-center font-display text-7xl font-extrabold text-plum/15">
                {producto.nombre.slice(0, 1)}
              </div>
            )}
            {descuento > 0 && (
              <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-berry px-3 py-1.5 text-sm font-bold text-white">
                -{descuento}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            {producto.categoria_nombre && (
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-plum-soft">
                {producto.categoria_nombre}
              </span>
            )}
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] text-plum sm:text-5xl">
              {producto.nombre}
            </h1>
            {producto.total_resenas > 0 && (
              <div className="flex items-center gap-2">
                <Estrellas valor={producto.promedio_calificacion} size={15} />
                <span className="text-sm text-plum-soft">
                  {producto.promedio_calificacion} ({producto.total_resenas}{" "}
                  {producto.total_resenas === 1 ? "reseña" : "reseñas"})
                </span>
              </div>
            )}
            <p className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className={`text-3xl font-extrabold ${producto.tiene_oferta ? "text-berry" : "text-plum"}`}>
                S/ {producto.precio_final.toFixed(2)}
              </span>
              {producto.tiene_oferta && (
                <>
                  <span className="text-lg text-plum-soft line-through">S/ {producto.precio.toFixed(2)}</span>
                  <span className="rounded-full bg-lilac px-3 py-1 text-sm font-bold text-berry-dark">
                    Ahorras S/ {(producto.precio - producto.precio_final).toFixed(2)}
                  </span>
                </>
              )}
            </p>
            {producto.sku && (
              <p className="text-xs text-plum-soft">
                SKU: <span className="font-mono tracking-wide text-plum">{producto.sku}</span>
              </p>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-[15px] leading-relaxed text-plum-soft">{producto.descripcion}</p>
          )}

          {producto.tallas?.length > 0 && (
            <div>
              <span id="talla-label" className="mb-3 block text-[15px] font-bold text-plum">
                Talla
                {talla && <span className="font-medium text-plum-soft"> · {talla}</span>}
              </span>
              <div role="radiogroup" aria-labelledby="talla-label" className="flex flex-wrap gap-2.5">
                {producto.tallas.map((t) => {
                  const sinStock = producto.usa_variantes && !tallaDisponible(t);
                  return (
                    <button
                      key={t}
                      role="radio"
                      aria-checked={talla === t}
                      onClick={() => setTalla(t)}
                      disabled={sinStock}
                      title={sinStock ? "Talla no disponible" : undefined}
                      className={`min-h-12 min-w-14 rounded-xl border-[1.5px] px-4 text-[15px] font-bold transition-all active:scale-95 disabled:cursor-not-allowed ${
                        sinStock
                          ? "border-plum/10 bg-[#f1eee9] text-plum-soft line-through"
                          : talla === t
                          ? "border-plum bg-plum text-ivory"
                          : "border-plum/18 bg-white text-plum hover:border-plum"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {producto.colores?.length > 0 && (
            <div>
              <span id="color-label" className="mb-3 block text-[15px] font-bold text-plum">
                Color
                {color && <span className="font-medium text-plum-soft"> · {color}</span>}
              </span>
              <div role="radiogroup" aria-labelledby="color-label" className="flex flex-wrap gap-3">
                {producto.colores.map((c) => {
                  const sinStock = producto.usa_variantes && !colorDisponible(c);
                  return (
                    <button
                      key={c}
                      role="radio"
                      aria-checked={color === c}
                      aria-label={c}
                      onClick={() => setColor(c)}
                      disabled={sinStock}
                      title={sinStock ? "Sin stock en esta combinación" : c}
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white transition-all active:scale-95 disabled:cursor-not-allowed ${
                        sinStock
                          ? "opacity-40"
                          : color === c
                          ? "ring-2 ring-plum ring-offset-2 ring-offset-ivory"
                          : "ring-1 ring-plum/15 hover:ring-plum/40"
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-plum/10"
                        style={{ backgroundColor: nombreColorAHex(c) }}
                        aria-hidden="true"
                      />
                      {sinStock && (
                        <span
                          className="pointer-events-none absolute inset-0 rounded-full"
                          style={{
                            backgroundImage:
                              "linear-gradient(to top right, transparent 46%, #57534e 48%, #57534e 52%, transparent 54%)",
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-labelledby="cantidad-label"
              className="flex h-13 items-center rounded-xl border-[1.5px] border-plum/18 bg-white"
            >
              <span id="cantidad-label" className="sr-only">Cantidad</span>
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                aria-label="Restar una unidad"
                className="flex h-12 w-12 items-center justify-center text-xl font-semibold text-plum hover:text-berry"
              >
                −
              </button>
              <span className="w-8 text-center text-[17px] font-bold" aria-live="polite">
                <SlidingNumber number={cantidad} />
              </span>
              <button
                onClick={() => setCantidad((c) => Math.min(stockSeleccion, c + 1))}
                disabled={cantidad >= stockSeleccion}
                aria-label="Sumar una unidad"
                className="flex h-12 w-12 items-center justify-center text-xl font-semibold text-plum hover:text-berry disabled:opacity-30"
              >
                +
              </button>
            </div>
            {producto.usa_variantes && stockSeleccion > 0 && stockSeleccion <= 3 && (
              <span className="rounded-full bg-lilac px-3 py-1.5 text-sm font-bold text-berry-dark">
                Quedan {stockSeleccion}
              </span>
            )}
          </div>

          {seleccionIncompleta && (
            <p className="-mt-2 text-sm font-semibold text-plum-soft" role="status">
              {textoBotonPendiente()} para continuar.
            </p>
          )}

          {sinStockEnCombo && (
            <p className="-mt-2 text-sm font-semibold text-berry-dark" role="alert">
              Sin stock para esta combinación de talla/color.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <RippleButton
              onClick={handleAgregar}
              disabled={producto.sin_stock || sinStockEnCombo || seleccionIncompleta || agregando}
              className="btn-dark min-h-13! flex-1 text-base! [--ripple-button-ripple-color:rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconCart size={18} />
              {producto.sin_stock || sinStockEnCombo ? "Sin stock" : agregando ? "Agregando..." : "Agregar al carrito"}
              <RippleButtonRipples />
            </RippleButton>
            <RippleButton
              onClick={handleComprar}
              disabled={producto.sin_stock || sinStockEnCombo || seleccionIncompleta || agregando}
              className="btn-primary icono-avance min-h-13! flex-1 text-base! [--ripple-button-ripple-color:rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comprar ahora
              <IconArrowRight size={18} />
              <RippleButtonRipples />
            </RippleButton>
            <button
              onClick={handleFavorito}
              aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={esFavorito}
              className={`icono-latido flex h-13 w-full shrink-0 items-center justify-center rounded-xl border-[1.5px] bg-white transition-colors sm:w-13 ${
                esFavorito ? "border-berry text-berry" : "border-plum/18 text-plum hover:border-berry hover:text-berry"
              }`}
            >
              <span key={esFavorito ? "si" : "no"} className={`flex ${esFavorito ? "animate-pop" : ""}`}>
                <IconHeart size={20} relleno={esFavorito} />
              </span>
            </button>
          </div>

          {mensaje && <p className="text-sm font-semibold text-berry-dark">{mensaje}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4 text-sm leading-snug">
              <strong className="block text-plum">Delivery en Huancayo</strong>
              <span className="text-plum-soft">S/ {COSTO_ENVIO_DELIVERY.toFixed(2)} a tu puerta</span>
            </div>
            <div className="rounded-2xl bg-white p-4 text-sm leading-snug">
              <strong className="block text-plum">Recojo en tienda</strong>
              <span className="text-plum-soft">Gratis, con código de recojo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calificación y reseñas */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="glass rounded-3xl p-6 shadow-glass sm:p-8">
          <h2 className="text-xl font-semibold text-plum">Escribe tu reseña</h2>
          {usuario ? (
            <form onSubmit={enviarResena} className="mt-4 space-y-3">
              <Estrellas valor={miCalificacion} onChange={setMiCalificacion} size={24} />
              <textarea
                placeholder="Cuéntanos qué te pareció el producto (opcional)"
                rows={3}
                maxLength={1000}
                value={miComentario}
                onChange={(e) => setMiComentario(e.target.value)}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-hidden"
              />
              {errorResena && <p className="text-sm text-berry-dark">{errorResena}</p>}
              <button
                type="submit"
                disabled={enviandoResena}
                className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {enviandoResena ? <><Spinner />Guardando...</> : "Publicar reseña"}
              </button>
              <p className="text-xs text-plum-soft">
                Solo puedes reseñar productos que hayas comprado.
              </p>
            </form>
          ) : (
            <p className="mt-3 text-sm text-plum-soft">
              <button onClick={() => navigate("/ingresar")} className="font-medium text-berry hover:underline">
                Ingresa
              </button>{" "}
              a tu cuenta para dejar tu reseña.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-plum">
            Reseñas {resenas.length > 0 && `(${resenas.length})`}
          </h2>
          {cargandoResenas ? (
            <SkeletonResenas cantidad={2} />
          ) : resenas.length === 0 ? (
            <p className="text-sm text-plum-soft">Sé la primera en reseñar este producto.</p>
          ) : (
            <div className="space-y-3">
              {resenas.map((r) => (
                <div key={r.id} className="glass rounded-2xl p-4 shadow-glass">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-plum">{r.usuario_nombre}</span>
                    <Estrellas valor={r.calificacion} size={14} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-plum-soft">
                    <span>{new Date(r.fecha_creacion).toLocaleDateString("es-PE")}</span>
                    {r.compra_verificada && (
                      <span className="rounded-full bg-berry/10 px-2 py-0.5 font-semibold text-berry-dark">
                        Compra verificada
                      </span>
                    )}
                  </div>
                  {r.comentario && <p className="mt-2 text-sm text-plum-soft">{r.comentario}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Productos relacionados: carrusel horizontal con flechas */}
      {cargandoRelacionados && productosRelacionados.length === 0 && (
        <section className="mt-16">
          <h3 className="font-display text-xl font-semibold text-plum">También te puede interesar</h3>
          <div className="mt-4">
            <SkeletonCarruselRelacionados />
          </div>
        </section>
      )}
      {productosRelacionados.length > 0 && (
        <section className="mt-16">
          <h3 className="font-display text-xl font-semibold text-plum">
            También te puede interesar
          </h3>
          <div className="relative mt-4">
            {productosRelacionados.length > 4 && (
              <button
                onClick={() => scrollCarrusel(-1)}
                aria-label="Ver productos anteriores"
                className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-berry text-white shadow-glass-lg transition hover:bg-berry-dark sm:flex"
              >
                ‹
              </button>
            )}

            <div
              ref={refCarrusel}
              className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            >
              {productosRelacionados.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/producto/${rel.id}`}
                  className="group w-40 shrink-0 rounded-xl border border-plum/10 p-3 transition hover:shadow-glass sm:w-48"
                >
                  <ImagenOptimizada
                    src={rel.imagen_url || "/placeholder.png"}
                    variante="thumb"
                    alt={rel.nombre}
                    className="h-40 w-full rounded-lg object-cover sm:h-48"
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-plum transition group-hover:text-berry">
                    {rel.nombre}
                  </p>
                  <p className="text-sm font-semibold text-plum">
                    S/ {rel.precio_final?.toFixed(2) || rel.precio?.toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>

            {productosRelacionados.length > 4 && (
              <button
                onClick={() => scrollCarrusel(1)}
                aria-label="Ver más productos"
                className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-3 items-center justify-center rounded-full bg-berry text-white shadow-glass-lg transition hover:bg-berry-dark sm:flex"
              >
                ›
              </button>
            )}
          </div>
        </section>
      )}

      {/* Envíos y Métodos de Pago - AL FINAL DE TODO. El bloque "Cuidados" se quitó: era el
          mismo texto para todos los productos ("crema para cuero ecológico" incluso en vestidos).
          Si se quiere volver a mostrar, debe venir de los datos de cada producto o categoría. */}
      <section className="mt-16 grid gap-6 sm:grid-cols-2 border-t border-plum/10 pt-10">

        {/* Envíos y Devoluciones */}
        <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
          <h4 className="font-display text-lg font-semibold text-plum">Envíos & Devoluciones</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-plum-soft">
            <li>• Delivery solo en Huancayo, en 3-5 días hábiles.</li>
            <li>• Cambios y devoluciones hasta 30 días después de la compra.</li>
            <li>
              • Para más información, revisa nuestra{" "}
              <Link to="/cambios-devoluciones" className="text-berry hover:underline">
                política de cambios
              </Link>.
            </li>
          </ul>
        </div>

        {/* Métodos de pago */}
        <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
          <h4 className="font-display text-lg font-semibold text-plum">Métodos de pago</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-plum-soft">
            {METODOS_PAGO_TIENDA.map((m) => (
              <li key={m.id}>• {m.resumen}.</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
