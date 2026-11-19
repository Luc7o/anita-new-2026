import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number";
import { useAuth } from "../context/AuthContext.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { IconSearch, IconCart, IconClose, IconUser, IconMenu, IconTruck, IconMapPin, IconTag, IconGift } from "./Icons.jsx";
import UserMenu from "./UserMenu.jsx";
import Logo from "./Logo.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { COSTO_ENVIO_DELIVERY } from "../tienda.js";
import { api } from "../api/client.js";
import { AnimateIcon } from "@animate-ui/react/icons";

// El menú es para comprar: la tienda, sus categorías y las ofertas. Las páginas informativas
// (Nosotros, Tiendas, Contacto, FAQ...) viven en el pie de página.
const MAX_CATEGORIAS_MENU = 5;
let categoriasEnMemoria = null; // se piden una sola vez por visita

function useCategoriasMenu() {
  const [categorias, setCategorias] = useState(categoriasEnMemoria || []);
  useEffect(() => {
    if (categoriasEnMemoria) return undefined;
    let vigente = true;
    api
      .categorias()
      .then((lista) => {
        categoriasEnMemoria = lista;
        if (vigente) setCategorias(lista);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);
  return categorias.slice(0, MAX_CATEGORIAS_MENU);
}

// Enlaces del menú con su condición de "activo" (la tienda usa parámetros en la URL:
// ?categoria=... y ?oferta=true, así que no basta con comparar la ruta).
function enlacesDeCompra(categorias, location) {
  const params = new URLSearchParams(location.search);
  const enTienda = location.pathname === "/tienda";
  const categoria = params.get("categoria");
  const oferta = params.get("oferta") === "true";
  return [
    { to: "/tienda", etiqueta: "Tienda", activo: enTienda && !categoria && !oferta },
    ...categorias.map((c) => ({
      to: `/tienda?categoria=${c.slug}`,
      etiqueta: c.nombre,
      activo: enTienda && categoria === c.slug,
    })),
    { to: "/tienda?oferta=true", etiqueta: "Ofertas", activo: enTienda && oferta, destacado: true },
  ];
}

const ANUNCIOS = [
  { Icono: IconTruck, texto: `Delivery en Huancayo por S/ ${COSTO_ENVIO_DELIVERY.toFixed(2)}` },
  { Icono: IconMapPin, texto: "Recojo en tienda gratis" },
  { Icono: IconTag, texto: "Paga con Yape o tarjeta" },
  { Icono: IconGift, texto: "Nuevos ingresos cada semana" },
];
const MS_POR_ANUNCIO = 4500;

// Barra de anuncios: UN mensaje a la vez, centrado, que cambia con un deslizamiento corto.
// (Antes era una cinta que corría sin parar: llamaba la atención todo el tiempo.)
// Se detiene mientras el mouse o el foco están encima y queda quieta con «reducir movimiento».
function BarraAnuncios() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reducir = useReducedMotion();

  useEffect(() => {
    if (pausado || reducir) return undefined;
    const id = setInterval(() => setIndice((i) => (i + 1) % ANUNCIOS.length), MS_POR_ANUNCIO);
    return () => clearInterval(id);
  }, [pausado, reducir]);

  const { Icono, texto } = ANUNCIOS[indice];
  return (
    <div
      className="relative flex h-9 items-center justify-center overflow-hidden bg-plum px-4 text-[13px] font-semibold text-ivory"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      role="region"
      aria-label="Anuncios de la tienda"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={texto}
          className="flex items-center gap-2 whitespace-nowrap"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {/* Cada mensaje nuevo se monta de nuevo: su ícono se anima una vez al aparecer. */}
          <Icono size={15} className="text-berry-light" animate />
          {texto}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Enlace({ to, activo, destacado, children, onClick, movil = false }) {
  const color = destacado ? "text-berry hover:text-berry-dark" : activo ? "text-plum" : "text-plum/75 hover:text-plum";
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={activo ? "page" : undefined}
      className={
        movil
          ? `rounded-xl px-3 py-3 text-base font-bold transition-colors ${
              activo ? "bg-plum text-ivory" : destacado ? "text-berry hover:bg-white" : "text-plum hover:bg-white"
            }`
          : `subrayado whitespace-nowrap py-2 text-[15px] font-semibold transition-colors ${color}`
      }
    >
      {children}
    </Link>
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
  const enlaces = enlacesDeCompra(useCategoriasMenu(), location);
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
            {enlaces.map((e) => (
              <Enlace key={e.to} to={e.to} activo={e.activo} destacado={e.destacado}>
                {e.etiqueta}
              </Enlace>
            ))}
          </div>

          {formBusqueda("ml-auto hidden w-60 xl:w-72 md:flex")}

          <div className="ml-auto flex items-center gap-2 md:ml-2">
            {/* En el celular la búsqueda es un ícono visible, no algo escondido en el menú. */}
            <AnimateIcon animateOnHover animateOnTap asChild>
              <button
                onClick={() => setBuscadorAbierto((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white text-plum transition-colors hover:border-berry hover:text-berry md:hidden"
                aria-label={buscadorAbierto ? "Cerrar búsqueda" : "Buscar"}
                aria-expanded={buscadorAbierto}
              >
                {buscadorAbierto ? <IconClose size={18} /> : <IconSearch size={18} />}
              </button>
            </AnimateIcon>

            {usuario ? (
              <UserMenu usuario={usuario} onLogout={cerrarSesion} />
            ) : (
              <AnimateIcon animateOnHover animateOnTap asChild>
                <Link
                  to="/ingresar"
                  className="hidden min-h-11 items-center gap-2 rounded-full border border-plum/15 bg-white px-4 text-sm font-bold text-plum transition-colors hover:border-berry hover:text-berry sm:inline-flex"
                >
                  <IconUser size={16} /> Ingresar
                </Link>
              </AnimateIcon>
            )}

            <AnimateIcon animateOnHover animateOnTap asChild>
              <button
                onClick={() => setDrawerAbierto(true)}
                className="relative flex min-h-11 items-center gap-2 rounded-full bg-plum px-4 text-sm font-bold text-ivory transition-colors hover:bg-black"
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
            </AnimateIcon>

            <AnimateIcon animateOnHover animateOnTap asChild>
              <button
                onClick={() => setMenuAbierto((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white text-plum lg:hidden"
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuAbierto}
              >
                {menuAbierto ? <IconClose size={18} /> : <IconMenu size={18} />}
              </button>
            </AnimateIcon>
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
                {enlaces.map((e) => (
                  <Enlace key={e.to} to={e.to} activo={e.activo} destacado={e.destacado} onClick={cerrar} movil>
                    {e.etiqueta}
                  </Enlace>
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
