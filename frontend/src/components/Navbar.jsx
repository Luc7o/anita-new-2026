import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconSearch, IconCart, IconClose } from "./Icons.jsx";
import UserMenu from "./UserMenu.jsx";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const { totalItems, setDrawerAbierto } = useCarrito();
  const [busqueda, setBusqueda] = useState("");
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);
  const navigate = useNavigate();

  const buscar = (e) => {
    e.preventDefault();
    navigate(`/tienda?q=${encodeURIComponent(busqueda)}`);
    setBusquedaMovilAbierta(false);
  };

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="glass-strong mx-auto flex max-w-6xl items-center gap-4 rounded-3xl px-5 py-3 shadow-glass">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold text-berry-dark">
          Anita <span className="text-plum">New Style</span>
        </Link>

        <form onSubmit={buscar} className="hidden flex-1 items-center gap-2 rounded-full bg-white/60 px-4 py-2 md:flex">
          <IconSearch size={16} className="shrink-0 text-plum-soft" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca vestidos, carteras, calzados..."
            maxLength={80}
            className="w-full bg-transparent text-sm text-plum placeholder:text-plum-soft/70 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-berry text-white transition hover:bg-berry-dark"
          >
            <IconSearch size={14} />
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-3 text-sm font-medium text-plum">
          {/* Botón de búsqueda para mobile (la barra de arriba está oculta en pantallas chicas) */}
          <button
            onClick={() => setBusquedaMovilAbierta((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-plum shadow-glass transition hover:bg-white md:hidden"
            aria-label="Buscar"
          >
            {busquedaMovilAbierta ? <IconClose size={16} /> : <IconSearch size={16} />}
          </button>

          {usuario ? (
            <UserMenu usuario={usuario} onLogout={logout} />
          ) : (
            <Link to="/ingresar" className="hover:text-berry">
              Ingresar
            </Link>
          )}

          <button
            onClick={() => setDrawerAbierto(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-berry text-white shadow-glass transition hover:bg-berry-dark"
            aria-label="Abrir carrito"
          >
            <IconCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-plum">
                {totalItems}
              </span>
            )}
          </button>
        </nav>
      </div>

      {busquedaMovilAbierta && (
        <form
          onSubmit={buscar}
          className="glass-strong mx-auto mt-2 flex max-w-6xl items-center gap-2 rounded-full px-4 py-2.5 shadow-glass md:hidden"
        >
          <IconSearch size={16} className="shrink-0 text-plum-soft" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca vestidos, carteras, calzados..."
            maxLength={80}
            className="w-full bg-transparent text-sm text-plum placeholder:text-plum-soft/70 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-berry text-white transition hover:bg-berry-dark"
          >
            <IconSearch size={14} />
          </button>
        </form>
      )}
    </header>
  );
}
