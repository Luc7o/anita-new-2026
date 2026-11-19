import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconClose, IconCart, IconTrash, IconArrowRight } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import { SkeletonLineasCarrito } from "./Skeleton.jsx";
import { useFocusTrap } from "../hooks/useFocusTrap.js";
import { AnimateIcon } from "@animate-ui/react/icons";

const RESORTE = { type: "spring", stiffness: 380, damping: 38 };

// En el celular el carrito sube desde abajo (como una hoja); en pantallas grandes entra por la derecha.
function useEsCelular() {
  const consulta = "(max-width: 639px)";
  const [esCelular, setEsCelular] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(consulta).matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.(consulta);
    if (!mq) return undefined;
    const alCambiar = (e) => setEsCelular(e.matches);
    mq.addEventListener?.("change", alCambiar);
    return () => mq.removeEventListener?.("change", alCambiar);
  }, []);
  return esCelular;
}

function LineaCarrito({ item, onCantidad, onQuitar, error, onNavegar }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex gap-3.5 overflow-hidden rounded-2xl bg-white p-3"
    >
      <Link
        to={`/producto/${item.producto.id}`}
        onClick={onNavegar}
        aria-label={`Ver ${item.producto.nombre}`}
        className="foto-vacia h-20 w-16 shrink-0 overflow-hidden rounded-xl"
      >
        {item.producto.imagen_url && (
          <ImagenOptimizada src={item.producto.imagen_url} variante="thumb" alt="" className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold leading-snug text-plum">{item.producto.nombre}</span>
          <AnimateIcon animateOnHover animateOnTap asChild>
            <button
              onClick={() => onQuitar(item.id)}
              className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-plum-soft transition-colors hover:bg-ivory hover:text-berry"
              aria-label={`Quitar ${item.producto.nombre} del carrito`}
            >
              <IconTrash size={16} />
            </button>
          </AnimateIcon>
        </div>
        {(item.talla || item.color) && (
          <span className="text-xs text-plum-soft">
            {item.talla && `Talla ${item.talla}`}
            {item.talla && item.color && " · "}
            {item.color}
          </span>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center rounded-xl border border-plum/15">
            <button
              onClick={() => onCantidad(item.id, item.cantidad - 1)}
              aria-label={`Restar una unidad de ${item.producto.nombre}`}
              className="flex h-10 w-10 items-center justify-center text-lg text-plum transition-colors hover:text-berry"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold" aria-live="polite">
              <SlidingNumber number={item.cantidad} />
            </span>
            <button
              onClick={() => onCantidad(item.id, item.cantidad + 1)}
              aria-label={`Sumar una unidad de ${item.producto.nombre}`}
              className="flex h-10 w-10 items-center justify-center text-lg text-plum transition-colors hover:text-berry"
            >
              +
            </button>
          </div>
          <span className="text-sm font-extrabold text-plum">S/ {item.subtotal.toFixed(2)}</span>
        </div>
        {item.problema && (
          <p className="mt-1 text-xs font-semibold text-berry-dark" role="alert">{item.problema}</p>
        )}
        {error && (
          <p className="mt-1 text-xs font-semibold text-berry-dark" role="alert">{error}</p>
        )}
      </div>
    </motion.li>
  );
}

export default function CartDrawer() {
  const { drawerAbierto, setDrawerAbierto, items, total, cargando, actualizarCantidad, eliminar } =
    useCarrito();
  const { usuario } = useAuth();
  const [errorPorItem, setErrorPorItem] = useState({});
  const esCelular = useEsCelular();

  const cambiarCantidad = async (itemId, nuevaCantidad) => {
    setErrorPorItem((prev) => ({ ...prev, [itemId]: null }));
    try {
      await actualizarCantidad(itemId, nuevaCantidad);
    } catch (err) {
      setErrorPorItem((prev) => ({ ...prev, [itemId]: err.message }));
    }
  };

  const quitar = async (itemId) => {
    setErrorPorItem((prev) => ({ ...prev, [itemId]: null }));
    try {
      await eliminar(itemId);
    } catch (err) {
      setErrorPorItem((prev) => ({ ...prev, [itemId]: err.message }));
    }
  };

  const cerrar = () => setDrawerAbierto(false);
  const refDialogo = useFocusTrap(drawerAbierto, cerrar);

  // Una línea con "problema" (por ejemplo, el stock bajó desde que se agregó)
  // sigue visible para que la persona la corrija, pero no se puede pagar así.
  const hayProblemas = items.some((item) => item.problema);
  const totalUnidades = items.reduce((suma, item) => suma + item.cantidad, 0);

  const panel = esCelular
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  return (
    <AnimatePresence>
      {drawerAbierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
          <motion.button
            key="fondo"
            aria-label="Cerrar carrito"
            onClick={cerrar}
            className="absolute inset-0 bg-plum/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.aside
            key="panel"
            ref={refDialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="carrito-titulo"
            tabIndex={-1}
            {...panel}
            transition={RESORTE}
            className="relative flex max-h-[88vh] w-full flex-col gap-4 rounded-t-3xl bg-ivory p-5 shadow-pop sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl sm:p-6"
          >
            {/* Asa de la hoja en el celular */}
            <span className="mx-auto -mt-1 h-1.5 w-12 rounded-full bg-plum/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 id="carrito-titulo" className="text-2xl text-plum">
                Tu carrito
                {totalUnidades > 0 && (
                  <span className="ml-2 align-middle font-sans text-sm font-bold tracking-normal text-plum-soft">
                    ({totalUnidades} {totalUnidades === 1 ? "producto" : "productos"})
                  </span>
                )}
              </h2>
              <AnimateIcon animateOnHover animateOnTap asChild>
                <button
                  onClick={cerrar}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-plum/10 bg-white text-plum transition-colors hover:border-berry hover:text-berry"
                  aria-label="Cerrar"
                >
                  <IconClose size={18} />
                </button>
              </AnimateIcon>
            </div>

            {cargando && items.length === 0 ? (
              <SkeletonLineasCarrito cantidad={2} />
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center text-plum-soft"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
                  <IconCart size={26} />
                </span>
                <p className="font-display text-xl font-bold text-plum">Tu carrito está vacío</p>
                <p className="max-w-[16rem] text-sm">Mira lo nuevo y agrega lo que te guste.</p>
                <Link to="/tienda" onClick={cerrar} className="btn-primary mt-1 px-6!">
                  Ver lo nuevo
                </Link>
              </motion.div>
            ) : (
              <>
                <ul className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1" aria-label="Productos en el carrito">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <LineaCarrito
                        key={item.id}
                        item={item}
                        onCantidad={cambiarCantidad}
                        onQuitar={quitar}
                        error={errorPorItem[item.id]}
                        onNavegar={cerrar}
                      />
                    ))}
                  </AnimatePresence>
                </ul>

                <div className="space-y-3 border-t border-plum/10 pt-4">
                  <div className="flex items-center justify-between text-plum">
                    <span className="font-bold">Total</span>
                    <span className="flex items-baseline text-xl font-extrabold">
                      S/&nbsp;
                      <SlidingNumber number={total} decimalPlaces={2} />
                    </span>
                  </div>
                  {hayProblemas && (
                    <p className="text-xs font-semibold text-berry-dark" role="alert">
                      Algunos productos cambiaron de disponibilidad. Ajusta las cantidades para continuar.
                    </p>
                  )}
                  {!usuario && !hayProblemas && (
                    <p className="text-center text-xs text-plum-soft">
                      No necesitas cuenta para comprar: solo tu correo al finalizar.
                    </p>
                  )}
                  {/* Con problemas de stock se muestra un botón deshabilitado de verdad: un enlace con
                      aria-disabled seguía recibiendo el foco y se activaba con Enter. */}
                  {hayProblemas ? (
                    <button type="button" disabled className="btn-primary w-full min-h-13! cursor-not-allowed opacity-50">
                      Ir a pagar
                    </button>
                  ) : (
                    <AnimateIcon animateOnHover animateOnTap asChild>
                      <Link to="/checkout" onClick={cerrar} className="btn-primary w-full min-h-13! text-base!">
                        Ir a pagar
                        <IconArrowRight size={18} />
                      </Link>
                    </AnimateIcon>
                  )}
                  <Link to="/carrito" onClick={cerrar} className="btn-relleno w-full">
                    Ver carrito completo
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
