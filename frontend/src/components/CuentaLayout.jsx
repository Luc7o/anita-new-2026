import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconUser,
  IconPackage,
  IconHeart,
  IconTag,
  IconSettings,
  IconHelp,
  IconArrowRight,
} from "./Icons.jsx";

const ITEMS = [
  { to: "/perfil", label: "Perfil", Icono: IconUser, exacto: true },
  { to: "/perfil/pedidos", label: "Pedidos", Icono: IconPackage },
  { to: "/perfil/favoritos", label: "Favoritos", Icono: IconHeart },
  { to: "/tienda?oferta=true", label: "Ofertas", Icono: IconTag },
  { to: "/perfil/configuracion", label: "Configuración", Icono: IconSettings },
  { to: "/perfil/ayuda", label: "Ayuda", Icono: IconHelp },
];

export default function CuentaLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Link
        to="/"
        aria-label="Volver al inicio"
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-plum transition hover:text-berry sm:right-6 sm:top-6"
      >
        <IconArrowRight size={18} />
      </Link>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="mb-8 font-display text-3xl font-semibold text-plum">Mi Cuenta</h1>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-60">
            <nav className="glass space-y-1 rounded-2xl p-3 shadow-glass">
              {ITEMS.map(({ to, label, Icono, exacto }) => {
                const ruta = to.split("#")[0].split("?")[0];
                const activo = exacto
                  ? location.pathname === ruta
                  : location.pathname === ruta || location.pathname.startsWith(`${ruta}/`);
                return (
                  <Link
                    key={label}
                    to={to}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      activo
                        ? "bg-berry/10 text-berry-dark"
                        : "text-plum-soft hover:bg-white/70 hover:text-plum"
                    }`}
                  >
                    <Icono size={17} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
