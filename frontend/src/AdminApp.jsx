import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { rutaAdmin } from "./lib/appMode.js";
import { CAJERO } from "./roles.js";
import { lazyConReintento as lazy } from "./utils/lazyConReintento.js";
import RutaAdmin from "./components/admin/RutaAdmin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminProductos = lazy(() => import("./pages/admin/AdminProductos.jsx"));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias.jsx"));
const AdminPromociones = lazy(() => import("./pages/admin/AdminPromociones.jsx"));
const AdminPedidos = lazy(() => import("./pages/admin/AdminPedidos.jsx"));
const AdminPedidoDetalle = lazy(() => import("./pages/admin/AdminPedidoDetalle.jsx"));
const AdminVentaPresencial = lazy(() => import("./pages/admin/AdminVentaPresencial.jsx"));
const AdminProveedores = lazy(() => import("./pages/admin/AdminProveedores.jsx"));
const AdminProveedorDetalle = lazy(() => import("./pages/admin/AdminProveedorDetalle.jsx"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios.jsx"));
const AdminConfiguracion = lazy(() => import("./pages/admin/AdminConfiguracion.jsx"));
const AdminReclamaciones = lazy(() => import("./pages/admin/AdminReclamaciones.jsx"));

// Pantalla de inicio del panel: el cajero no tiene dashboard, así que al entrar
// (o al abrir "/") va directo a Nueva venta. Los demás roles ven el dashboard.
function Inicio() {
  const { usuario } = useAuth();
  if (usuario?.rol === CAJERO) return <Navigate to={rutaAdmin("/pedidos/nueva-venta")} replace />;
  return <AdminDashboard />;
}

// Rutas del panel. Son relativas: en la tienda sin subdominio cuelgan de
// "/admin/*" y en el subdominio del admin (VITE_APP_MODE=admin) de "/".
export default function AdminApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RutaAdmin>
            <AdminLayout />
          </RutaAdmin>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="categorias" element={<AdminCategorias />} />
        <Route path="promociones" element={<AdminPromociones />} />
        <Route path="pedidos" element={<AdminPedidos />} />
        <Route path="pedidos/:id" element={<AdminPedidoDetalle />} />
        <Route path="pedidos/nueva-venta" element={<AdminVentaPresencial />} />
        <Route path="reportes" element={<Navigate to=".." replace />} />
        <Route path="proveedores" element={<AdminProveedores />} />
        <Route path="proveedores/:id" element={<AdminProveedorDetalle />} />
        <Route path="reclamaciones" element={<AdminReclamaciones />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
        <Route path="configuracion" element={<AdminConfiguracion />} />
      </Route>
    </Routes>
  );
}
