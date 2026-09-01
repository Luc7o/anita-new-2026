import React, { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  IconDashboard, IconBag, IconTag, IconPackage, IconStore, IconLogout, IconTruck, IconUsers, IconSettings,
  IconCart, IconReceipt, IconMenu, IconClose, IconGift,
} from "../Icons.jsx";
import {
  PUEDE_VER_PRODUCTOS, PUEDE_VER_PEDIDOS, PUEDE_GESTIONAR_PEDIDOS, PUEDE_VER_PROVEEDORES,
  PUEDE_GESTIONAR_USUARIOS, PUEDE_VER_DASHBOARD, PUEDE_VER_PROMOCIONES,
} from "../../roles.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const TODOS_LOS_ITEMS = [
  { to: "/admin", label: "Dashboard", Icon: IconDashboard, exact: true, roles: null },
  { to: "/admin/productos", label: "Productos", Icon: IconBag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/categorias", label: "Categorías", Icon: IconTag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/promociones", label: "Promociones", Icon: IconGift, roles: PUEDE_VER_PROMOCIONES },
  { to: "/admin/proveedores", label: "Proveedores", Icon: IconTruck, roles: PUEDE_VER_PROVEEDORES },
  { to: "/admin/pedidos", label: "Pedidos", Icon: IconPackage, exact: true, roles: PUEDE_VER_PEDIDOS },
  { to: "/admin/pedidos/nueva-venta", label: "Nueva venta", Icon: IconCart, roles: PUEDE_GESTIONAR_PEDIDOS },
  { to: "/admin/reportes", label: "Reportes", Icon: IconReceipt, roles: PUEDE_VER_DASHBOARD },
  { to: "/admin/usuarios", label: "Usuarios y roles", Icon: IconUsers, roles: PUEDE_GESTIONAR_USUARIOS },
  { to: "/admin/configuracion", label: "Configuración", Icon: IconSettings, roles: PUEDE_GESTIONAR_USUARIOS },
];

function ContenidoNav({ items, usuario, logout, alNavegar }) {
  return (
    <>
      <div className="mb-4 px-2">
        <span className="text-lg font-semibold text-berry-dark">Admin</span>
        <p className="truncate text-xs text-plum-soft">{usuario?.email}</p>
        <p className="text-xs font-medium text-berry">{usuario?.rol_label}</p>
      </div>

      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          onClick={alNavegar}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-berry text-white" : "text-plum hover:bg-white/60"
            }`
          }
        >
          <item.Icon size={17} />
          {item.label}
        </NavLink>
      ))}

      <div className="mt-4 space-y-1 border-t border-white/50 pt-4">
        <Link
          to="/"
          onClick={alNavegar}
          className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-plum-soft hover:bg-white/60"
        >
          <IconStore size={17} /> Volver a la tienda
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-plum-soft hover:bg-white/60"
        >
          <IconLogout size={17} /> Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const items = TODOS_LOS_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.rol));
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);
  const refDrawer = useFocusTrap(menuAbierto, cerrarMenu);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      {/* Barra superior — solo en móvil/tablet */}
      <div className="glass-strong sticky top-4 z-30 mb-4 flex items-center justify-between rounded-2xl px-4 py-3 shadow-glass md:hidden">
        <button
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú del panel admin"
          className="flex items-center gap-2 text-sm font-semibold text-plum"
        >
          <IconMenu size={20} />
          Menú
        </button>
        <span className="text-xs font-medium text-berry">{usuario?.rol_label}</span>
      </div>

      {/* Drawer del menú — solo en móvil/tablet */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={cerrarMenu}
            className="absolute inset-0 bg-plum/30 backdrop-blur-sm"
          />
          <aside
            ref={refDrawer}
            role="dialog"
            aria-modal="true"
            aria-label="Menú del panel admin"
            tabIndex={-1}
            className="glass-strong relative flex h-full w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto p-4 shadow-glass-lg"
          >
            <button
              onClick={cerrarMenu}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 rounded-full p-1.5 text-plum-soft hover:bg-white/60 hover:text-plum"
            >
              <IconClose size={18} />
            </button>
            <ContenidoNav items={items} usuario={usuario} logout={logout} alNavegar={cerrarMenu} />
          </aside>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar fija — solo en desktop */}
        <aside className="glass-strong sticky top-24 hidden h-fit w-56 shrink-0 space-y-1 rounded-3xl p-4 shadow-glass md:block">
          <ContenidoNav items={items} usuario={usuario} logout={logout} />
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
