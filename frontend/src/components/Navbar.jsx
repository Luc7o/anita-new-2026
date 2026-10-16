import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconSearch, IconCart, IconClose, IconUser, IconMenu, IconHome } from "./Icons.jsx";
import UserMenu from "./UserMenu.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";

const ENLACES = [
  ["/tienda", "Tienda"],
  ["/quienes-somos", "Nosotros"],
  ["/tiendas", "Tiendas"],
  ["/contacto", "Contáctanos"],
  ["/faq", "FAQ"],
];

function Enlace({ to, end, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
          isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const config = useConfigTienda();
  const { totalItems, setDrawerAbierto } = useCarrito();
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const cerrar = () => setMenuAbierto(false);

  const buscar = (e) => {
    e.preventDefault();
    navigate(`/tienda?q=${encodeURIComponent(busqueda)}`);
    cerrar();
  };

  const formBusqueda = (clase, autoFocus = false) => (
    <form
      onSubmit={buscar}
      className={`group items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3 py-2 transition focus-within:border-white/60 focus-within:bg-white/15 ${clase}`}
    >
      <IconSearch size={15} className="shrink-0 text-white/70" />
      <input
        autoFocus={autoFocus}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar vestidos, carteras, calzados..."
        maxLength={80}
        aria-label="Buscar en la tienda"
        className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
      />
    </form>
  );

  return (
    <header className="sticky top-0 z-30 bg-plum/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" onClick={cerrar} className="mr-3 shrink-0 font-display text-2xl font-bold" aria-label="Anita New Style, ir al inicio">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.nombre_comercial} className="h-9 w-auto" />
          ) : (
            <>
              <span className="text-white">Anita</span> <span className="text-berry-light">New Style</span>
            </>
          )}
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          <Enlace to="/" end>
            <IconHome size={16} />
            <span className="sr-only">Inicio</span>
          </Enlace>
          {ENLACES.map(([to, etiqueta]) => (
            <Enlace key={to} to={to}>{etiqueta}</Enlace>
          ))}
        </div>

        {formBusqueda("ml-auto hidden w-64 xl:w-80 md:flex")}

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          {usuario ? (
            <UserMenu usuario={usuario} onLogout={logout} />
          ) : (
            <Link
              to="/ingresar"
              className="btn hidden border border-white/25 text-white hover:bg-white/10 sm:inline-flex"
            >
              <IconUser size={16} /> Ingresar
            </Link>
          )}

          <button
            onClick={() => setDrawerAbierto(true)}
            className="relative flex items-center gap-2 rounded-[10px] border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            aria-label="Abrir carrito"
          >
            <IconCart size={16} />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              // key={totalItems}: cada cambio de cantidad repite el "pop".
              <span
                key={totalItems}
                className="flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-berry px-1 text-[11px] font-bold text-white"
              >
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/25 text-white lg:hidden"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <IconClose size={18} /> : <IconMenu size={18} />}
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div className="animate-fade-in border-t border-white/10 px-4 pb-4 lg:hidden">
          {formBusqueda("mt-3 flex md:hidden")}
          <div className="flex flex-col gap-1 pt-2">
            <Enlace to="/" end onClick={cerrar}>Inicio</Enlace>
            {ENLACES.map(([to, etiqueta]) => (
              <Enlace key={to} to={to} onClick={cerrar}>{etiqueta}</Enlace>
            ))}
            {!usuario && (
              <Link to="/ingresar" onClick={cerrar} className="btn mt-2 border border-white/25 text-white hover:bg-white/10">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
