import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconSearch, IconCart, IconClose, IconUser } from "./Icons.jsx";
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
    <header className="sticky top-0 z-30 border-b border-plum/10 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-5 py-4">
        <Link to="/" className="shrink-0 font-display text-2xl">
          <span className="text-plum">Anita</span> <span className="text-berry">New Style</span>
        </Link>

        <form
          onSubmit={buscar}
          className="group mx-auto hidden w-full max-w-xl items-center gap-2 rounded-full border border-plum/10 bg-lilac/50 px-4 py-2.5 transition focus-within:border-berry/30 focus-within:bg-white focus-within:shadow-glass md:flex"
        >
          <IconSearch
            size={15}
            className="shrink-0 text-plum-soft transition group-focus-within:text-berry"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar vestidos, carteras, calzados..."
            maxLength={80}
            className="w-full bg-transparent text-sm text-plum placeholder:text-plum-soft/60 focus:outline-none"
          />
        </form>

        <nav className="flex items-center gap-4 justify-self-end">
          <button
            onClick={() => setBusquedaMovilAbierta((v) => !v)}
            className="flex h-9 w-9 items-center justify-center text-plum md:hidden"
            aria-label="Buscar"
          >
            {busquedaMovilAbierta ? <IconClose size={18} /> : <IconSearch size={18} />}
          </button>

          {usuario ? (
            <UserMenu usuario={usuario} onLogout={logout} />
          ) : (
            <Link
              to="/ingresar"
              className="flex items-center gap-1.5 text-sm font-medium text-plum hover:text-berry"
            >
              <IconUser size={19} />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}

          <button
            onClick={() => setDrawerAbierto(true)}
            className="relative flex h-9 w-9 items-center justify-center text-plum hover:text-berry"
            aria-label="Abrir carrito"
          >
            <IconCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-berry text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </nav>
      </div>

      {busquedaMovilAbierta && (
        <form
          onSubmit={buscar}
          className="mx-5 my-3 flex items-center gap-2 rounded-full border border-plum/10 bg-lilac/50 px-4 py-2.5 transition focus-within:border-berry/30 focus-within:bg-white focus-within:shadow-glass md:hidden"
        >
          <IconSearch size={15} className="shrink-0 text-plum-soft" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar vestidos, carteras, calzados..."
            maxLength={80}
            className="w-full bg-transparent text-sm text-plum placeholder:text-plum-soft/60 focus:outline-none"
          />
        </form>
      )}
    </header>
  );
}
