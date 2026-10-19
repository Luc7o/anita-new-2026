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
import { ADMIN_URL } from "./lib/appMode.js";
import { useAuth } from "./context/AuthContext.jsx";
import { useCarrito } from "./context/CarritoContext.jsx";
import { api } from "./api/client.js";

// Panel de administración: con VITE_ADMIN_URL (panel en otro dominio) el
// import dinámico queda dentro de una rama muerta y Vite lo descarta, así el
// build de la tienda no incluye el código del panel.
const AdminApp = import.meta.env.VITE_ADMIN_URL
  ? null
  : lazy(() => import("./AdminApp.jsx"));

function RedirigirAlPanel() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.location.replace(ADMIN_URL + pathname.replace(/^\/admin/, ""));
  }, [pathname]);
  return <CargandoPagina />;
}

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
    // Panel de administración. Con VITE_ADMIN_URL el panel vive en su propio
    // dominio: aquí solo se redirige y su código no entra en este build.
    if (!AdminApp) return <RedirigirAlPanel />;
    return (
      <div className="min-h-screen">
        {bannerSesionExpirada}
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
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