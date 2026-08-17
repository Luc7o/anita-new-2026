import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  IconDashboard, IconBag, IconTag, IconPackage, IconStore, IconLogout, IconTruck, IconUsers, IconSettings,
} from "../Icons.jsx";
import {
  PUEDE_VER_PRODUCTOS, PUEDE_VER_PEDIDOS, PUEDE_VER_PROVEEDORES, PUEDE_GESTIONAR_USUARIOS,
} from "../../roles.js";

const TODOS_LOS_ITEMS = [
  { to: "/admin", label: "Dashboard", Icon: IconDashboard, exact: true, roles: null },
  { to: "/admin/productos", label: "Productos", Icon: IconBag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/categorias", label: "Categorías", Icon: IconTag, roles: PUEDE_VER_PRODUCTOS },
  { to: "/admin/proveedores", label: "Proveedores", Icon: IconTruck, roles: PUEDE_VER_PROVEEDORES },
  { to: "/admin/pedidos", label: "Pedidos", Icon: IconPackage, roles: PUEDE_VER_PEDIDOS },
  { to: "/admin/usuarios", label: "Usuarios y roles", Icon: IconUsers, roles: PUEDE_GESTIONAR_USUARIOS },
  { to: "/admin/configuracion", label: "Configuración", Icon: IconSettings, roles: PUEDE_GESTIONAR_USUARIOS },
];

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const items = TODOS_LOS_ITEMS.filter((item) => !item.roles || item.roles.includes(usuario?.rol));

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-16">
      <aside className="glass-strong sticky top-24 h-fit w-56 shrink-0 space-y-1 rounded-3xl p-4 shadow-glass">
        <div className="mb-4 px-2">
          <span className="font-display text-lg font-semibold text-berry-dark">Admin</span>
          <p className="truncate text-xs text-plum-soft">{usuario?.email}</p>
          <p className="text-xs font-medium text-berry">{usuario?.rol_label}</p>
        </div>

        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
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
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
