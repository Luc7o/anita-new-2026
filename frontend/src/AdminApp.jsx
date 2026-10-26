import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { rutaAdmin } from "./lib/appMode.js";
import {
  CAJERO, PUEDE_VER_PRODUCTOS, PUEDE_GESTIONAR_CATEGORIAS, PUEDE_VER_PROMOCIONES, PUEDE_VER_PEDIDOS,
  PUEDE_REGISTRAR_VENTA, PUEDE_VER_PROVEEDORES, PUEDE_VER_RECLAMACIONES, PUEDE_GESTIONAR_USUARIOS,
  PUEDE_VER_CONFIGURACION,
} from "./roles.js";
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
const AdminRecojosCajero = lazy(() => import("./pages/admin/AdminRecojosCajero.jsx"));
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

// Si alguien escribe a mano la dirección de una sección que su rol no usa, vuelve
// al inicio de su rol (el servidor igual le negaría los datos).
function Solo({ roles, children }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario?.rol)) return <Navigate to={rutaAdmin()} replace />;
  return children;
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
        <Route path="productos" element={<Solo roles={PUEDE_VER_PRODUCTOS}><AdminProductos /></Solo>} />
        <Route path="categorias" element={<Solo roles={PUEDE_GESTIONAR_CATEGORIAS}><AdminCategorias /></Solo>} />
        <Route path="promociones" element={<Solo roles={PUEDE_VER_PROMOCIONES}><AdminPromociones /></Solo>} />
        <Route path="pedidos" element={<Solo roles={PUEDE_VER_PEDIDOS}><AdminPedidos /></Solo>} />
        <Route path="pedidos/nueva-venta" element={<Solo roles={PUEDE_REGISTRAR_VENTA}><AdminVentaPresencial /></Solo>} />
        <Route path="pedidos/recojos" element={<Solo roles={[CAJERO]}><AdminRecojosCajero /></Solo>} />
        <Route path="pedidos/:id" element={<Solo roles={PUEDE_VER_PEDIDOS}><AdminPedidoDetalle /></Solo>} />
        <Route path="reportes" element={<Navigate to=".." replace />} />
        <Route path="proveedores" element={<Solo roles={PUEDE_VER_PROVEEDORES}><AdminProveedores /></Solo>} />
        <Route path="proveedores/:id" element={<Solo roles={PUEDE_VER_PROVEEDORES}><AdminProveedorDetalle /></Solo>} />
        <Route path="reclamaciones" element={<Solo roles={PUEDE_VER_RECLAMACIONES}><AdminReclamaciones /></Solo>} />
        <Route path="usuarios" element={<Solo roles={PUEDE_GESTIONAR_USUARIOS}><AdminUsuarios /></Solo>} />
        <Route path="configuracion" element={<Solo roles={PUEDE_VER_CONFIGURACION}><AdminConfiguracion /></Solo>} />
      </Route>
    </Routes>
  );
}
