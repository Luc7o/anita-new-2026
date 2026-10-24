import { rutaAdmin, IS_ADMIN_APP, TIENDA_URL } from "../../lib/appMode.js";
import React from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Logo from "../Logo.jsx";
import {
  IconDashboard, IconBag, IconTag, IconPackage, IconStore, IconLogout, IconTruck, IconUsers, IconSettings,
  IconCart, IconGift, IconBook, IconUser,
} from "../Icons.jsx";
import {
  PUEDE_VER_PRODUCTOS, PUEDE_GESTIONAR_CATEGORIAS, PUEDE_VER_PEDIDOS, PUEDE_REGISTRAR_VENTA, PUEDE_VER_INICIO, PUEDE_VER_PROVEEDORES,
  PUEDE_GESTIONAR_USUARIOS, PUEDE_VER_CONFIGURACION, PUEDE_VER_PROMOCIONES, PUEDE_VER_RECLAMACIONES,
  CAJERO,
} from "../../roles.js";

const TODOS_LOS_ITEMS = [
  { to: rutaAdmin(), label: "Dashboard", Icon: IconDashboard, exact: true, roles: PUEDE_VER_INICIO },
  { to: rutaAdmin("/productos"), label: "Productos", Icon: IconBag, roles: PUEDE_VER_PRODUCTOS },
  { to: rutaAdmin("/categorias"), label: "Categorías", Icon: IconTag, roles: PUEDE_GESTIONAR_CATEGORIAS },
  { to: rutaAdmin("/promociones"), label: "Promociones", Icon: IconGift, roles: PUEDE_VER_PROMOCIONES },
  { to: rutaAdmin("/proveedores"), label: "Proveedores", Icon: IconTruck, roles: PUEDE_VER_PROVEEDORES },
  { to: rutaAdmin("/pedidos"), label: "Pedidos", Icon: IconPackage, exact: true, roles: PUEDE_VER_PEDIDOS },
  { to: rutaAdmin("/pedidos/nueva-venta"), label: "Nueva venta", Icon: IconCart, roles: PUEDE_REGISTRAR_VENTA },
  { to: rutaAdmin("/reclamaciones"), label: "Reclamaciones", Icon: IconBook, roles: PUEDE_VER_RECLAMACIONES },
  { to: rutaAdmin("/usuarios"), label: "Usuarios y roles", Icon: IconUsers, roles: PUEDE_GESTIONAR_USUARIOS },
  { to: rutaAdmin("/configuracion"), label: "Configuración", Icon: IconSettings, roles: PUEDE_VER_CONFIGURACION },
];

function TiendaLink() {
  const clases =
    "ml-2 flex items-center gap-2 rounded-[10px] border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10";
  const contenido = (
    <>
      <IconStore size={16} />
      <span className="hidden sm:inline">Ver tienda</span>
    </>
  );
  return IS_ADMIN_APP ? (
    <a href={TIENDA_URL} target="_blank" rel="noopener noreferrer" className={clases} title="Abrir la tienda">
      {contenido}
    </a>
  ) : (
    <Link to="/" className={clases} title="Volver a la tienda">
      {contenido}
    </Link>
  );
}

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Cambiar de cuenta = cerrar la sesión actual y quedar en el login para entrar con otra.
  const cambiarDeCuenta = () => {
    logout();
    navigate(IS_ADMIN_APP ? "/login" : "/ingresar", { replace: true });
  };
  const items = TODOS_LOS_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.rol));

  return (
    <div className="admin-ui flex min-h-screen flex-col">
      {/* Cabecera oscura fija (estructura de Malhu) */}
      <header className="sticky top-0 z-40 bg-plum/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to={rutaAdmin()} aria-label="Panel de administración">
            <Logo tone="light" />
          </Link>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white/80">
            {usuario?.rol === CAJERO ? "Cajero" : "Admin"}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden max-w-[12rem] truncate text-sm font-semibold text-white sm:inline">
              {usuario?.rol_label}
            </span>
            {/* En el subdominio del admin no hay tienda propia: el botón solo
                aparece si se definió VITE_TIENDA_URL, y abre la tienda aparte. */}
            {(!IS_ADMIN_APP || TIENDA_URL) && (
              <TiendaLink />
            )}
            <button
              onClick={logout}
              className="rounded-[10px] p-2.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Barra lateral (pantallas grandes): ocupa todo el lado izquierdo, bajo la cabecera */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 flex-col overflow-y-auto border-r border-plum/10 bg-white/60 backdrop-blur lg:flex">
          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Administración">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-berry text-white shadow-sm"
                      : "text-plum-soft hover:bg-plum/5 hover:text-plum"
                  }`
                }
              >
                <item.Icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Cuenta: al final de la barra lateral */}
          <div className="border-t border-plum/10 p-3">
            <div className="mb-2 px-3.5">
              <p className="truncate text-sm font-semibold text-plum">
                {[usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || usuario?.email}
              </p>
              <p className="truncate text-xs text-plum-soft">{usuario?.rol_label}</p>
            </div>
            <button
              type="button"
              onClick={cambiarDeCuenta}
              className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-plum-soft transition-colors hover:bg-plum/5 hover:text-plum"
            >
              <IconUser size={18} />
              Cambiar de cuenta
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold text-berry-dark transition-colors hover:bg-berry/10"
            >
              <IconLogout size={18} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Pestañas horizontales (celular y tablet), donde no cabe la barra lateral */}
          <div className="sticky top-[57px] z-30 border-b border-plum/10 bg-ivory/95 backdrop-blur lg:hidden">
            <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4" aria-label="Administración">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "border-berry text-plum"
                        : "border-transparent text-plum-soft hover:text-plum"
                    }`
                  }
                >
                  <item.Icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            {/* key: al cambiar de sección el contenido entra con fundido + leve subida */}
            <div key={location.pathname} className="animate-fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
