import React from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Logo from "../Logo.jsx";
import {
  IconDashboard, IconBag, IconTag, IconPackage, IconStore, IconLogout, IconTruck, IconUsers, IconSettings,
  IconCart, IconReceipt, IconGift, IconBook,
} from "../Icons.jsx";
import {
  PUEDE_VER_PRODUCTOS, PUEDE_VER_PEDIDOS, PUEDE_GESTIONAR_PEDIDOS, PUEDE_VER_PROVEEDORES,
  PUEDE_GESTIONAR_USUARIOS, PUEDE_VER_CONFIGURACION, PUEDE_VER_DASHBOARD, PUEDE_VER_PROMOCIONES, PUEDE_VER_RECLAMACIONES,
} from "../../roles.js";

const TODOS_LOS_ITEMS = [
  { to: "/admin", label: "Dashboard", Icon: IconDashboard, exact: true, roles: null },
  { to: "/admin/productos", label: "Productos", Icon: IconBag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/categorias", label: "Categorías", Icon: IconTag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/promociones", label: "Promociones", Icon: IconGift, roles: PUEDE_VER_PROMOCIONES },
  { to: "/admin/proveedores", label: "Proveedores", Icon: IconTruck, roles: PUEDE_VER_PROVEEDORES },
  { to: "/admin/pedidos", label: "Pedidos", Icon: IconPackage, exact: true, roles: PUEDE_VER_PEDIDOS },
  { to: "/admin/pedidos/nueva-venta", label: "Nueva venta", Icon: IconCart, roles: PUEDE_GESTIONAR_PEDIDOS },
  { to: "/admin/reportes", label: "Reportes", Icon: IconReceipt, roles: PUEDE_VER_DASHBOARD },
  { to: "/admin/reclamaciones", label: "Reclamaciones", Icon: IconBook, roles: PUEDE_VER_RECLAMACIONES },
  { to: "/admin/usuarios", label: "Usuarios y roles", Icon: IconUsers, roles: PUEDE_GESTIONAR_USUARIOS },
  { to: "/admin/configuracion", label: "Configuración", Icon: IconSettings, roles: PUEDE_VER_CONFIGURACION },
];

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const items = TODOS_LOS_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.rol));

  return (
    <div className="admin-ui flex min-h-screen flex-col">
      {/* Cabecera oscura fija (estructura de Malhu) */}
      <header className="sticky top-0 z-40 bg-plum/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/admin" aria-label="Panel de administración">
            <Logo tone="light" />
          </Link>
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white/80">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden max-w-[12rem] truncate text-sm font-semibold text-white sm:inline">
              {usuario?.rol_label}
            </span>
            <Link
              to="/"
              className="ml-2 flex items-center gap-2 rounded-[10px] border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              title="Volver a la tienda"
            >
              <IconStore size={16} />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
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

      {/* Pestañas de sección (reemplazan la barra lateral) */}
      <div className="sticky top-[57px] z-30 border-b border-plum/10 bg-ivory/95 backdrop-blur">
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

      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-16 pt-8">
        {/* key: al cambiar de sección el contenido entra con fundido + leve subida */}
        <div key={location.pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
