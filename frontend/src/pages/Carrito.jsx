import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconCart, IconTrash } from "../components/Icons.jsx";
import ImagenOptimizada from "../components/ImagenOptimizada.jsx";
import { Skeleton, SkeletonRegion } from "../components/Skeleton.jsx";

// Carrito "a detalle": vista completa del carrito (foto grande, precio
// unitario, cantidades y resumen del pedido). El drawer es el atajo rápido;
// esta página es para revisar con calma antes de pagar.
export default function Carrito() {
  const { items, total, totalItems, cargando, actualizarCantidad, eliminar } = useCarrito();
  const { usuario } = useAuth();
  const [errorPorItem, setErrorPorItem] = useState({});
  const [ocupados, setOcupados] = useState({}); // líneas con una petición en curso
  const [quitando, setQuitando] = useState({}); // líneas animándose antes de salir

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
    marcar(setQuitando, itemId, true);
    // Deja correr la animación de salida antes de quitar la línea de verdad.
    await new Promise((resolver) => setTimeout(resolver, 250));
    try {
      await eliminar(itemId);
    } catch (err) {
      marcar(setErrorPorItem, itemId, err.message);
      marcar(setQuitando, itemId, false);
    }
  };

  const hayProblemas = items.some((item) => item.problema);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-plum">Tu carrito</h1>
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
              <div key={i} className="glass flex gap-4 rounded-3xl p-4 shadow-glass">
                <Skeleton className="h-28 w-24 shrink-0 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="mt-auto h-8 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="glass h-fit space-y-4 rounded-3xl p-6 shadow-glass" aria-hidden="true">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </SkeletonRegion>
      ) : items.length === 0 ? (
        <div className="glass flex animate-fade-in flex-col items-center gap-4 rounded-3xl p-12 text-center shadow-glass">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
            <IconCart size={28} />
          </span>
          <p className="text-lg font-semibold text-plum">Tu carrito está vacío</p>
          <p className="max-w-sm text-sm text-plum-soft">
            Agrega productos y vuelve aquí para revisarlos antes de pagar.
          </p>
          <Link
            to="/tienda"
            className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark active:scale-95"
          >
            Explorar tienda
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
          <ul className="space-y-4">
            {items.map((item, i) => {
              const producto = item.producto;
              const conOferta = producto.tiene_oferta && producto.precio > producto.precio_final;
              return (
                <li
                  key={item.id}
                  className={`glass flex animate-fade-in-up gap-4 rounded-3xl p-4 shadow-glass transition-all duration-300 ${
                    quitando[item.id] ? "scale-95 opacity-0" : ""
                  }`}
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <Link
                    to={`/producto/${producto.id}`}
                    aria-label={`Ver ${producto.nombre}`}
                    className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-lilac to-white sm:h-32 sm:w-28"
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
                          className="block font-semibold leading-snug text-plum transition hover:text-berry"
                        >
                          {producto.nombre}
                        </Link>
                        <p className="mt-0.5 text-xs text-plum-soft">
                          {[item.talla && `Talla ${item.talla}`, item.color].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <button
                        onClick={() => quitar(item.id)}
                        aria-label={`Quitar ${producto.nombre} del carrito`}
                        className="shrink-0 rounded-full p-2 text-plum-soft transition hover:bg-white/60 hover:text-berry active:scale-90"
                      >
                        <IconTrash size={16} />
                      </button>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                          disabled={ocupados[item.id]}
                          aria-label={`Restar una unidad de ${producto.nombre}`}
                          className="h-8 w-8 rounded-full border border-plum/15 bg-white/70 text-plum transition hover:bg-white active:scale-90 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span key={item.cantidad} className="w-6 animate-pop text-center font-semibold" aria-live="polite">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          disabled={ocupados[item.id]}
                          aria-label={`Sumar una unidad de ${producto.nombre}`}
                          className="h-8 w-8 rounded-full border border-plum/15 bg-white/70 text-plum transition hover:bg-white active:scale-90 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <span key={item.subtotal} className="animate-fade-in font-bold text-berry-dark">
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
                </li>
              );
            })}
          </ul>

          <aside
            className="glass h-fit animate-fade-in space-y-4 rounded-3xl p-6 shadow-glass md:sticky md:top-24"
            aria-labelledby="resumen-titulo"
          >
            <h2 id="resumen-titulo" className="text-lg font-semibold text-plum">Resumen del pedido</h2>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-plum-soft">
                  Subtotal ({totalItems} {totalItems === 1 ? "producto" : "productos"})
                </dt>
                <dd key={total} className="animate-fade-in font-medium text-plum">S/ {total.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-plum-soft">Envío</dt>
                <dd className="text-plum-soft">Se calcula al pagar</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between border-t border-plum/10 pt-4 text-lg font-semibold text-plum">
              <span>Total</span>
              <span key={total} className="animate-fade-in">S/ {total.toFixed(2)}</span>
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

            <Link
              to="/checkout"
              aria-disabled={hayProblemas}
              className={`block w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark active:scale-[0.98] ${
                hayProblemas ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Ir a pagar
            </Link>
            <Link
              to="/tienda"
              className="block w-full rounded-full border border-plum/20 bg-white/60 py-3 text-center text-sm font-semibold text-plum transition hover:bg-white active:scale-[0.98]"
            >
              Seguir comprando
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
