import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconSearch, IconCart, IconClose, IconUser, IconMenu } from "./Icons.jsx";
import UserMenu from "./UserMenu.jsx";
import Logo from "./Logo.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";

const ENLACES = [
  ["/tienda", "Tienda"],
  ["/quienes-somos", "Nosotros"],
  ["/tiendas", "Tiendas"],
  ["/contacto", "Contáctanos"],
  ["/faq", "FAQ"],
];

const ANUNCIOS = [
  `Delivery en Huancayo por S/ ${COSTO_ENVIO_DELIVERY.toFixed(2)}`,
  "Recojo en tienda gratis",
  "Paga con Yape o tarjeta",
  "Nuevos ingresos cada semana",
];

// Barra de anuncios que se desliza sola. El contenido va dos veces para que el bucle no
// tenga corte; la segunda copia se oculta a los lectores de pantalla.
function BarraAnuncios() {
  const fila = (oculta) =>
    ANUNCIOS.map((texto) => (
      <span key={texto + oculta} className="flex items-center gap-12" aria-hidden={oculta || undefined}>
        {texto}
        <span className="text-berry-light" aria-hidden="true">✦</span>
      </span>
    ));
  return (
    <div className="anuncios overflow-hidden bg-plum py-2.5 text-[13px] font-semibold text-ivory">
      <div className="anuncios-pista flex w-max gap-12 pr-12 whitespace-nowrap">
        {fila(false)}
        {fila(true)}
      </div>
    </div>
  );
}

function Enlace({ to, end, children, onClick, movil = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        movil
          ? `rounded-xl px-3 py-3 text-base font-bold transition-colors ${isActive ? "bg-plum text-ivory" : "text-plum hover:bg-white"}`
          : `subrayado py-2 text-[15px] font-semibold transition-colors ${isActive ? "text-plum" : "text-plum/75 hover:text-plum"}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const toast = useToast();
  const cerrarSesion = () => {
    logout();
    toast.info("Cerraste sesión");
  };
  const { totalItems, setDrawerAbierto } = useCarrito();
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const cerrar = () => {
    setMenuAbierto(false);
    setBuscadorAbierto(false);
  };

  // El cuadro de búsqueda refleja lo que realmente se está buscando: si la URL
  // cambia (por ejemplo al elegir una categoría, que borra la búsqueda), se vacía.
  useEffect(() => {
    const q = location.pathname === "/tienda" ? new URLSearchParams(location.search).get("q") : "";
    setBusqueda(q || "");
  }, [location.pathname, location.search]);

  const buscar = (e) => {
    e.preventDefault();
    navigate(`/tienda?q=${encodeURIComponent(busqueda)}`);
    cerrar();
  };

  const formBusqueda = (clase, autoFocus = false) => (
    <form
      onSubmit={buscar}
      role="search"
      className={`items-center gap-2 rounded-full border border-plum/15 bg-white px-4 transition-colors focus-within:border-berry ${clase}`}
    >
      <IconSearch size={16} className="shrink-0 text-plum-soft" />
      <input
        autoFocus={autoFocus}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar carteras, calzados..."
        maxLength={80}
        aria-label="Buscar en la tienda"
        className="min-h-11 w-full bg-transparent text-sm text-plum placeholder:text-plum-soft focus:outline-hidden"
      />
    </form>
  );

  return (
    <>
      <BarraAnuncios />
      <header className="sticky top-0 z-30 border-b border-plum/8 bg-ivory/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-8" aria-label="Principal">
          <Link to="/" onClick={cerrar} className="mr-4 shrink-0" aria-label="Anita New Style, ir al inicio">
            <Logo tone="dark" />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            <Enlace to="/" end>Inicio</Enlace>
            {ENLACES.map(([to, etiqueta]) => (
              <Enlace key={to} to={to}>{etiqueta}</Enlace>
            ))}
          </div>

          {formBusqueda("ml-auto hidden w-60 xl:w-72 md:flex")}

          <div className="ml-auto flex items-center gap-2 md:ml-2">
            {/* En el celular la búsqueda es un ícono visible, no algo escondido en el menú. */}
            <button
              onClick={() => setBuscadorAbierto((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white text-plum transition-colors hover:border-berry hover:text-berry md:hidden"
              aria-label={buscadorAbierto ? "Cerrar búsqueda" : "Buscar"}
              aria-expanded={buscadorAbierto}
            >
              {buscadorAbierto ? <IconClose size={18} /> : <IconSearch size={18} />}
            </button>

            {usuario ? (
              <UserMenu usuario={usuario} onLogout={cerrarSesion} />
            ) : (
              <Link
                to="/ingresar"
                className="hidden min-h-11 items-center gap-2 rounded-full border border-plum/15 bg-white px-4 text-sm font-bold text-plum transition-colors hover:border-berry hover:text-berry sm:inline-flex"
              >
                <IconUser size={16} /> Ingresar
              </Link>
            )}

            <button
              onClick={() => setDrawerAbierto(true)}
              className="icono-rebote relative flex min-h-11 items-center gap-2 rounded-full bg-plum px-4 text-sm font-bold text-ivory transition-colors hover:bg-black"
              aria-label={`Abrir carrito${totalItems > 0 ? `, ${totalItems} productos` : ""}`}
            >
              <IconCart size={17} />
              <span className="hidden sm:inline">Carrito</span>
              {totalItems > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-berry px-1.5 text-xs font-bold text-white" aria-hidden="true">
                  {/* El número se desliza al cambiar: se nota que algo se agregó. */}
                  <SlidingNumber number={totalItems} />
                </span>
              )}
            </button>

            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white text-plum lg:hidden"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuAbierto}
            >
              {menuAbierto ? <IconClose size={18} /> : <IconMenu size={18} />}
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {buscadorAbierto && (
            <motion.div
              key="buscador"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden px-4 md:hidden"
            >
              {formBusqueda("mb-3 flex", true)}
            </motion.div>
          )}
          {menuAbierto && (
            <motion.div
              key="menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden border-t border-plum/8 lg:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                <Enlace to="/" end onClick={cerrar} movil>Inicio</Enlace>
                {ENLACES.map(([to, etiqueta]) => (
                  <Enlace key={to} to={to} onClick={cerrar} movil>{etiqueta}</Enlace>
                ))}
                {!usuario && (
                  <Link to="/ingresar" onClick={cerrar} className="btn-dark mt-2">
                    Ingresar
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
