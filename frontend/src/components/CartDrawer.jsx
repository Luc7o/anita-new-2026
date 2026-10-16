import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconClose, IconCart } from "./Icons.jsx";
import ImagenOptimizada from "./ImagenOptimizada.jsx";
import { SkeletonLineasCarrito } from "./Skeleton.jsx";
import { useFocusTrap } from "../hooks/useFocusTrap.js";

// Lo que tarda la animación de salida; después de esto el drawer se desmonta.
const DURACION_SALIDA_MS = 220;

export default function CartDrawer() {
  const { drawerAbierto, setDrawerAbierto, items, total, cargando, actualizarCantidad, eliminar } =
    useCarrito();
  const { usuario } = useAuth();
  const [errorPorItem, setErrorPorItem] = useState({});

  // Animación de salida: al cerrar, el drawer sigue montado DURACION_SALIDA_MS
  // para poder deslizarse hacia afuera en vez de desaparecer de golpe.
  const [cerrando, setCerrando] = useState(false);
  const estabaAbierto = useRef(drawerAbierto);
  useEffect(() => {
    if (drawerAbierto) {
      setCerrando(false);
      estabaAbierto.current = true;
      return undefined;
    }
    if (!estabaAbierto.current) return undefined;
    estabaAbierto.current = false;
    setCerrando(true);
    const temporizador = setTimeout(() => setCerrando(false), DURACION_SALIDA_MS);
    return () => clearTimeout(temporizador);
  }, [drawerAbierto]);

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

  if (!drawerAbierto && !cerrando) return null;

  // Una línea con "problema" (por ejemplo, el stock bajó desde que se agregó)
  // sigue visible para que la persona la corrija, pero no se puede pagar así.
  const hayProblemas = items.some((item) => item.problema);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${cerrando ? "pointer-events-none" : ""}`}>
      {/* Fondo del drawer */}
      <button
        aria-label="Cerrar carrito"
        onClick={cerrar}
        className={`absolute inset-0 bg-plum/30 backdrop-blur-sm ${
          cerrando ? "animate-fade-out" : "animate-fade-in"
        }`}
      />

      <aside
        ref={refDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-titulo"
        tabIndex={-1}
        className={`glass-strong relative flex h-full w-full max-w-md flex-col gap-4 rounded-l-3xl p-6 shadow-glass-lg ${
          cerrando ? "animate-slide-out-right" : "animate-slide-in-right"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 id="carrito-titulo" className="text-xl font-semibold text-plum">Tu carrito</h2>
          <button
            onClick={cerrar}
            className="rounded-full p-2 text-plum-soft transition hover:bg-white/50 active:scale-90"
            aria-label="Cerrar"
          >
            <IconClose />
          </button>
        </div>

        {cargando && items.length === 0 ? (
          <SkeletonLineasCarrito cantidad={2} />
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-plum-soft">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lilac text-berry">
              <IconCart size={24} />
            </span>
            <p className="font-semibold text-plum">Tu carrito está vacío</p>
            <p className="max-w-[16rem] text-sm">Mira lo nuevo y agrega lo que te guste.</p>
            <Link to="/tienda" onClick={cerrar} className="btn-primary btn mt-1 !px-6">
              Ver lo nuevo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="glass flex animate-fade-in-up gap-3 rounded-2xl p-3"
                  style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
                >
                  <Link
                    to={`/producto/${item.producto.id}`}
                    onClick={cerrar}
                    aria-label={`Ver ${item.producto.nombre}`}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-lilac to-white"
                  >
                    {item.producto.imagen_url && (
                      <ImagenOptimizada
                        src={item.producto.imagen_url}
                        variante="thumb"
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-plum">
                      {item.producto.nombre}
                    </span>
                    <span className="text-xs text-plum-soft">
                      {item.talla && `Talla ${item.talla} · `}
                      {item.color}
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                          aria-label={`Restar una unidad de ${item.producto.nombre}`}
                          className="h-6 w-6 rounded-full bg-white/70 text-sm leading-none text-plum transition hover:bg-white active:scale-90"
                        >
                          −
                        </button>
                        <span key={item.cantidad} className="w-4 animate-pop text-center text-sm" aria-live="polite">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          aria-label={`Sumar una unidad de ${item.producto.nombre}`}
                          className="h-6 w-6 rounded-full bg-white/70 text-sm leading-none text-plum transition hover:bg-white active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-berry-dark">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {item.problema && (
                      <p className="mt-1 text-xs text-berry-dark" role="alert">{item.problema}</p>
                    )}
                    {errorPorItem[item.id] && (
                      <p className="mt-1 text-xs text-berry-dark" role="alert">{errorPorItem[item.id]}</p>
                    )}
                  </div>
                  <button
                    onClick={() => quitar(item.id)}
                    className="self-start text-plum-soft transition hover:text-berry active:scale-90"
                    aria-label="Quitar producto"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/50 pt-4">
              <div className="flex items-center justify-between text-lg font-semibold text-plum">
                <span>Total</span>
                <span key={total} className="animate-fade-in">S/ {total.toFixed(2)}</span>
              </div>
              {hayProblemas && (
                <p className="text-xs text-berry-dark" role="alert">
                  Algunos productos cambiaron de disponibilidad. Ajusta las cantidades para continuar.
                </p>
              )}
              {!usuario && !hayProblemas && (
                <p className="text-center text-xs text-plum-soft">
                  No necesitas cuenta para comprar: solo tu correo al finalizar.
                </p>
              )}
              <Link
                to="/carrito"
                onClick={cerrar}
                className="block w-full rounded-full border border-plum/20 bg-white/60 py-3 text-center font-semibold text-plum transition hover:bg-white active:scale-[0.98]"
              >
                Ver carrito
              </Link>
              <Link
                to="/checkout"
                onClick={cerrar}
                aria-disabled={hayProblemas}
                className={`block w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark active:scale-[0.98] ${
                  hayProblemas ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Ir a pagar
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
