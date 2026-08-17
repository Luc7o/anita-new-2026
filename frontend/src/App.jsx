import React, { useEffect } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Home from "./pages/Home.jsx";
import Tienda from "./pages/Tienda.jsx";
import ProductoDetalle from "./pages/ProductoDetalle.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import OlvidePassword from "./pages/OlvidePassword.jsx";
import RestablecerPassword from "./pages/RestablecerPassword.jsx";
import Perfil from "./pages/Perfil.jsx";
import Checkout from "./pages/Checkout.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import PedidoDetalle from "./pages/PedidoDetalle.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useCarrito } from "./context/CarritoContext.jsx";
import RutaAdmin from "./components/admin/RutaAdmin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProductos from "./pages/admin/AdminProductos.jsx";
import AdminCategorias from "./pages/admin/AdminCategorias.jsx";
import AdminPedidos from "./pages/admin/AdminPedidos.jsx";
import AdminPedidoDetalle from "./pages/admin/AdminPedidoDetalle.jsx";
import AdminProveedores from "./pages/admin/AdminProveedores.jsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.jsx";
import AdminConfiguracion from "./pages/admin/AdminConfiguracion.jsx";

export default function App() {
  const { usuario, sesionExpirada, setSesionExpirada } = useAuth();
  const { refrescar } = useCarrito();
  const location = useLocation();
  const esAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (usuario) refrescar();
  }, [usuario, refrescar]);

  // Se limpia solo al cambiar de página (por ejemplo, al ir a /ingresar),
  // para no dejar el aviso pegado después de que el usuario ya reaccionó.
  useEffect(() => {
    if (sesionExpirada) setSesionExpirada(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const bannerSesionExpirada = sesionExpirada && (
    <div className="bg-berry px-4 py-2.5 text-center text-sm font-medium text-white">
      Tu sesión expiró.{" "}
      <Link to="/ingresar" className="underline">
        Vuelve a iniciar sesión
      </Link>
      .
    </div>
  );

  if (esAdmin) {
    return (
      <div className="min-h-screen pt-8">
        {bannerSesionExpirada}        <Routes>
          <Route
            path="/admin"
            element={
              <RutaAdmin>
                <AdminLayout />
              </RutaAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="categorias" element={<AdminCategorias />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="pedidos/:id" element={<AdminPedidoDetalle />} />
            <Route path="proveedores" element={<AdminProveedores />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="configuracion" element={<AdminConfiguracion />} />
          </Route>
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {bannerSesionExpirada}
      <Navbar />
      <main className="pt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} />
        </Routes>
      </main>
      <CartDrawer />
    </div>
  );
}
