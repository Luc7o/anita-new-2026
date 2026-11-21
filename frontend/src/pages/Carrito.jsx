import React, { useState } from "react";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconCart, IconTrash, IconArrowRight } from "../components/Icons.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { Skeleton, SkeletonRegion } from "../components/Skeleton.jsx";
import { AnimateIcon } from "@animate-ui/react/icons";

// Carrito "a detalle": vista completa del carrito (foto grande, precio
// unitario, cantidades y resumen del pedido). El drawer es el atajo rápido;
// esta página es para revisar con calma antes de pagar.
export default function Carrito() {
  const { items, total, totalItems, cargando, actualizarCantidad, eliminar } = useCarrito();
  const { usuario } = useAuth();
  const [errorPorItem, setErrorPorItem] = useState({});
  const [ocupados, setOcupados] = useState({}); // líneas con una petición en curso

  const marcar = (setter, id, valor) => setter((prev) => ({ ...prev, [id]: valor }));

  const cambiarCantidad = async (itemId, nuevaCantidad) => {
    marcar(setErrorPorItem, itemId, null);
    marcar(setOcupados, itemId, true);
    try {
      await actualizarCantidad(itemId, nuevaCantidad);
    } catch (err) {
      marcar(setErrorPorItem, itemId, err.message);
    } finally {
      marcar(setOcupados, itemId, false);
    }
  };

  const quitar = async (itemId) => {
    marcar(setErrorPorItem, itemId, null);
    // La línea sale con su propia animación (AnimatePresence): no hace falta esperar aquí.
    try {
      await eliminar(itemId);
    } catch (err) {
      marcar(setErrorPorItem, itemId, err.message);
    }
  };

  const hayProblemas = items.some((item) => item.problema);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
      <div className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className="text-4xl font-extrabold text-plum sm:text-5xl">Tu carrito</h1>
        {!cargando && items.length > 0 && (
          <span className="text-sm text-plum-soft">
            {totalItems} {totalItems === 1 ? "producto" : "productos"}
          </span>
        )}
      </div>

      {cargando && items.length === 0 ? (
        <SkeletonRegion etiqueta="Cargando tu carrito" className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-4 rounded-[20px] bg-white p-4">
                <Skeleton className="h-28 w-24 shrink-0 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="mt-auto h-8 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-fit space-y-4 rounded-[20px] bg-white p-6" aria-hidden="true">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </SkeletonRegion>
      ) : items.length === 0 ? (
        <EstadoVacio
          icono={IconCart}
          titulo="Tu carrito está vacío"
          texto="Mira lo nuevo de la tienda y agrega lo que te guste; aquí lo revisas antes de pagar."
          enlace="/tienda"
          etiqueta="Ver lo nuevo"
          className="p-12"
        />
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
          <ul className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const producto = item.producto;
              const conOferta = producto.tiene_oferta && producto.precio > producto.precio_final;
              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.05 } }}
                  exit={{ opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  className="flex gap-4 overflow-hidden rounded-[20px] bg-white p-4"
                >
                  <Link
                    to={`/producto/${producto.id}`}
                    aria-label={`Ver ${producto.nombre}`}
                    className="foto-vacia h-32 w-26 shrink-0 overflow-hidden rounded-2xl sm:h-36 sm:w-28"
                  >
                    {producto.imagen_url && (
                      <ImagenOptimizada
                        src={producto.imagen_url}
                        variante="thumb"
                        alt={producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/producto/${producto.id}`}
                          className="block font-bold leading-snug text-plum transition-colors hover:text-berry"
                        >
                          {producto.nombre}
                        </Link>
                        <p className="mt-0.5 text-xs text-plum-soft">
                          {[item.talla && `Talla ${item.talla}`, item.color].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <AnimateIcon animateOnHover animateOnTap asChild>
                        <button
                          onClick={() => quitar(item.id)}
                          aria-label={`Quitar ${producto.nombre} del carrito`}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-plum-soft transition-colors hover:bg-ivory hover:text-berry"
                        >
                          <IconTrash size={16} />
                        </button>
                      </AnimateIcon>
                    </div>

                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                      <span className="font-semibold text-plum">S/ {producto.precio_final.toFixed(2)}</span>
                      {conOferta && (
                        <span className="text-xs text-plum-soft line-through">
                          S/ {producto.precio.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-plum-soft">c/u</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center rounded-xl border-[1.5px] border-plum/15">
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                          disabled={ocupados[item.id]}
                          aria-label={`Restar una unidad de ${producto.nombre}`}
                          className="flex h-11 w-11 items-center justify-center text-lg text-plum transition-colors hover:text-berry disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-7 text-center font-bold" aria-live="polite">
                          <SlidingNumber number={item.cantidad} />
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          disabled={ocupados[item.id]}
                          aria-label={`Sumar una unidad de ${producto.nombre}`}
                          className="flex h-11 w-11 items-center justify-center text-lg text-plum transition-colors hover:text-berry disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-lg font-extrabold text-plum">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {item.problema && (
                      <p className="mt-2 text-xs text-berry-dark" role="alert">{item.problema}</p>
                    )}
                    {errorPorItem[item.id] && (
                      <p className="mt-2 text-xs text-berry-dark" role="alert">{errorPorItem[item.id]}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
            </AnimatePresence>
          </ul>

          <aside
            className="boleta h-fit animate-fade-in space-y-4 md:sticky md:top-28"
            aria-labelledby="resumen-titulo"
          >
            <h2 id="resumen-titulo" className="text-2xl text-plum">Resumen</h2>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-plum-soft">
                  Subtotal ({totalItems} {totalItems === 1 ? "producto" : "productos"})
                </dt>
                <dd className="cifra font-semibold text-plum">S/ {total.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-plum-soft">Envío</dt>
                <dd className="text-right text-plum-soft">
                  S/ {COSTO_ENVIO_DELIVERY.toFixed(2)} con delivery
                  <br />
                  Gratis con recojo en tienda
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-between border-t border-dashed border-plum/30 pt-4 text-plum">
              <span className="font-extrabold uppercase">Total (sin envío)</span>
              <span className="cifra flex items-baseline text-2xl font-semibold">
                S/&nbsp;
                <SlidingNumber number={total} decimalPlaces={2} />
              </span>
            </div>

            {hayProblemas && (
              <p className="text-xs text-berry-dark" role="alert">
                Algunos productos cambiaron de disponibilidad. Ajusta las cantidades para continuar.
              </p>
            )}
            {!usuario && !hayProblemas && (
              <p className="text-xs text-plum-soft">
                No necesitas cuenta para comprar: solo tu correo al finalizar.
              </p>
            )}

            {/* Con problemas de stock va un botón deshabilitado de verdad (un enlace con
                aria-disabled seguía recibiendo el foco y se activaba con Enter). */}
            {hayProblemas ? (
              <button type="button" disabled className="btn-primary w-full min-h-13! cursor-not-allowed opacity-50">
                Ir a pagar
              </button>
            ) : (
              <AnimateIcon animateOnHover animateOnTap asChild>
                <Link to="/checkout" className="btn-primary w-full min-h-13! text-base!">
                  Ir a pagar
                  <IconArrowRight size={18} />
                </Link>
              </AnimateIcon>
            )}
            <Link to="/tienda" className="btn-relleno w-full">
              Seguir comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
