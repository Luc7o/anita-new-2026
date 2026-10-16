import React, { Suspense, useEffect } from "react";
import { lazyConReintento as lazy } from "./utils/lazyConReintento.js";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Carrito from "./pages/Carrito.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import CargandoPagina from "./components/CargandoPagina.jsx";
const FormasPago = lazy(() => import("./pages/FormasPago.jsx"));
const MetodosEnvio = lazy(() => import("./pages/MetodosEnvio.jsx"));
const CambiosDevoluciones = lazy(() => import("./pages/CambiosDevoluciones.jsx"));
const FAQ = lazy(() => import("./pages/FAQ.jsx"));
const Contacto = lazy(() => import("./pages/Contacto.jsx"));
const LibroReclamaciones = lazy(() => import("./pages/LibroReclamaciones.jsx"));
const PoliticaPrivacidad = lazy(() => import("./pages/PoliticaPrivacidad.jsx"));
const TerminosCondiciones = lazy(() => import("./pages/TerminosCondiciones.jsx"));
const QuienesSomos = lazy(() => import("./pages/QuienesSomos.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));
const NuestrasTiendas = lazy(() => import("./pages/NuestrasTiendas.jsx"));
const Mayoristas = lazy(() => import("./pages/Mayoristas.jsx"));
const TrabajaConNosotros = lazy(() => import("./pages/TrabajaConNosotros.jsx"));
import Home from "./pages/Home.jsx";
import Tienda from "./pages/Tienda.jsx";
import ProductoDetalle from "./pages/ProductoDetalle.jsx";
const Login = lazy(() => import("./pages/Login.jsx"));
const Registro = lazy(() => import("./pages/Registro.jsx"));
const OlvidePassword = lazy(() => import("./pages/OlvidePassword.jsx"));
const RestablecerPassword = lazy(() => import("./pages/RestablecerPassword.jsx"));
const Perfil = lazy(() => import("./pages/Perfil.jsx"));
const PerfilPedidos = lazy(() => import("./pages/PerfilPedidos.jsx"));
const Configuracion = lazy(() => import("./pages/Configuracion.jsx"));
const Favoritos = lazy(() => import("./pages/Favoritos.jsx"));
const Ayuda = lazy(() => import("./pages/Ayuda.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Pedidos = lazy(() => import("./pages/Pedidos.jsx"));
const PedidoDetalle = lazy(() => import("./pages/PedidoDetalle.jsx"));
import { useAuth } from "./context/AuthContext.jsx";
import { useCarrito } from "./context/CarritoContext.jsx";
import { api } from "./api/client.js";
import RutaAdmin from "./components/admin/RutaAdmin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminProductos = lazy(() => import("./pages/admin/AdminProductos.jsx"));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias.jsx"));
const AdminPromociones = lazy(() => import("./pages/admin/AdminPromociones.jsx"));
const AdminPedidos = lazy(() => import("./pages/admin/AdminPedidos.jsx"));
const AdminPedidoDetalle = lazy(() => import("./pages/admin/AdminPedidoDetalle.jsx"));
const AdminVentaPresencial = lazy(() => import("./pages/admin/AdminVentaPresencial.jsx"));
const AdminReportes = lazy(() => import("./pages/admin/AdminReportes.jsx"));
const AdminProveedores = lazy(() => import("./pages/admin/AdminProveedores.jsx"));
const AdminProveedorDetalle = lazy(() => import("./pages/admin/AdminProveedorDetalle.jsx"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios.jsx"));
const AdminConfiguracion = lazy(() => import("./pages/admin/AdminConfiguracion.jsx"));
const AdminReclamaciones = lazy(() => import("./pages/admin/AdminReclamaciones.jsx"));

export default function App() {
  const { usuario, sesionExpirada, setSesionExpirada } = useAuth();
  const { refrescar } = useCarrito();
  const location = useLocation();
  const esAdmin = location.pathname.startsWith("/admin");
  const esAuth =
    location.pathname === "/ingresar" ||
    location.pathname === "/registro" ||
    location.pathname === "/olvide-password" ||
    location.pathname === "/restablecer-password";
  const esCuenta =
    location.pathname === "/perfil" ||
    location.pathname === "/perfil/pedidos" ||
    location.pathname === "/perfil/favoritos" ||
    location.pathname === "/perfil/configuracion" ||
    location.pathname === "/perfil/ayuda";

  useEffect(() => {
    if (usuario) refrescar();
  }, [usuario, refrescar]);

  // Se limpia solo al cambiar de página (por ejemplo, al ir a /ingresar),
  // para no dejar el aviso pegado después de que el usuario ya reaccionó.
  // Vista de página para KPIs de negocio: solo la tienda pública cuenta como
  // "visita" (la navegación del propio admin dentro de /admin no debe
  // inflar la métrica). El tipo "vista_pagina" ya existía en el modelo
  // EventoAnalitica desde la migración de KPIs, pero nada lo disparaba
  // todavía — este es el único lugar que faltaba.
  useEffect(() => {
    if (!esAdmin) {
      api.registrarEvento("vista_pagina", { metadata: { ruta: location.pathname } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
      <div className="min-h-screen">
        {bannerSesionExpirada}        <Suspense fallback={<CargandoPagina />}>
        <Routes>
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
            <Route path="promociones" element={<AdminPromociones />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="pedidos/:id" element={<AdminPedidoDetalle />} />
            <Route path="pedidos/nueva-venta" element={<AdminVentaPresencial />} />
            <Route path="reportes" element={<AdminReportes />} />
            <Route path="proveedores" element={<AdminProveedores />} />
            <Route path="proveedores/:id" element={<AdminProveedorDetalle />} />
            <Route path="reclamaciones" element={<AdminReclamaciones />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="configuracion" element={<AdminConfiguracion />} />
          </Route>
        </Routes>
        </Suspense>
      </div>
    );
  }

  if (esAuth) {
    return (
      <div className="min-h-screen">
        {bannerSesionExpirada}
        <div key={location.pathname} className="animate-fade-in">
        <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
        </Routes>
        </Suspense>
        </div>
      </div>
    );
  }

  if (esCuenta) {
    return (
      <div className="min-h-screen">
        {bannerSesionExpirada}
        <div key={location.pathname} className="animate-fade-in">
        <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/pedidos" element={<PerfilPedidos />} />
          <Route path="/perfil/favoritos" element={<Favoritos />} />
          <Route path="/perfil/configuracion" element={<Configuracion />} />
          <Route path="/perfil/ayuda" element={<Ayuda />} />
        </Routes>
        </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {bannerSesionExpirada}
      <Navbar />
      <main className={location.pathname === "/" || location.pathname === "/tienda" ? "" : "pt-8"}>
        {/* key: al cambiar de ruta el contenido se vuelve a montar y entra con
            una animación suave (fundido + leve subida) en vez de "saltar". */}
        <div key={location.pathname} className="animate-fade-in-up">
        <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} />
          <Route path="/formas-de-pago" element={<FormasPago />} />
          <Route path="/metodos-de-envio" element={<MetodosEnvio />} />
          <Route path="/cambios-devoluciones" element={<CambiosDevoluciones />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/libro-reclamaciones" element={<LibroReclamaciones />} />
          <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/tiendas" element={<NuestrasTiendas />} />
          <Route path="/mayoristas" element={<Mayoristas />} />
          <Route path="/trabaja-con-nosotros" element={<TrabajaConNosotros />} />
        </Routes>
        </Suspense>
        </div>
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}