import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconClose } from "./Icons.jsx";

export default function CartDrawer() {
  const { drawerAbierto, setDrawerAbierto, items, total, actualizarCantidad, eliminar } =
    useCarrito();
  const { usuario } = useAuth();
  const [errorPorItem, setErrorPorItem] = useState({});

  const cambiarCantidad = async (itemId, nuevaCantidad) => {
    setErrorPorItem((prev) => ({ ...prev, [itemId]: null }));
    try {
      await actualizarCantidad(itemId, nuevaCantidad);
    } catch (err) {
      setErrorPorItem((prev) => ({ ...prev, [itemId]: err.message }));
    }
  };

  if (!drawerAbierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo del drawer */}
      <button
        aria-label="Cerrar carrito"
        onClick={() => setDrawerAbierto(false)}
        className="absolute inset-0 bg-plum/30 backdrop-blur-sm"
      />

      <aside className="glass-strong relative flex h-full w-full max-w-md flex-col gap-4 rounded-l-3xl p-6 shadow-glass-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-plum">Tu carrito</h2>
          <button
            onClick={() => setDrawerAbierto(false)}
            className="rounded-full p-2 text-plum-soft hover:bg-white/50"
            aria-label="Cerrar"
          >
            <IconClose />
          </button>
        </div>

        {!usuario ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-plum-soft">
            <p>Ingresa a tu cuenta para ver tu carrito.</p>
            <Link
              to="/ingresar"
              onClick={() => setDrawerAbierto(false)}
              className="rounded-full bg-berry px-5 py-2 text-sm font-semibold text-white shadow-glass"
            >
              Ingresar
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-plum-soft">
            Tu carrito está vacío por ahora.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="glass flex gap-3 rounded-2xl p-3">
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br from-lilac to-white" />
                  <div className="flex flex-1 flex-col">
                    <span className="font-display text-sm font-medium text-plum">
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
                          className="h-6 w-6 rounded-full bg-white/70 text-sm leading-none text-plum hover:bg-white"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          className="h-6 w-6 rounded-full bg-white/70 text-sm leading-none text-plum hover:bg-white"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display text-sm font-semibold text-berry-dark">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {errorPorItem[item.id] && (
                      <p className="mt-1 text-xs text-berry-dark">{errorPorItem[item.id]}</p>
                    )}
                  </div>
                  <button
                    onClick={() => eliminar(item.id)}
                    className="self-start text-plum-soft hover:text-berry"
                    aria-label="Quitar producto"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/50 pt-4">
              <div className="flex items-center justify-between font-display text-lg font-semibold text-plum">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setDrawerAbierto(false)}
                className="block w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark"
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
