import React, { Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import CargandoPagina from "./components/CargandoPagina.jsx";
import AdminApp from "./AdminApp.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

// Raíz de la app cuando se construye con VITE_APP_MODE=admin
// (admin.tudominio.com): solo el panel, sin tienda, carrito ni favoritos.
export default function AdminRaiz() {
  const { sesionExpirada, setSesionExpirada } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (sesionExpirada) setSesionExpirada(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="min-h-screen">
      {sesionExpirada && (
        <div className="bg-berry px-4 py-2.5 text-center text-sm font-medium text-white">
          Tu sesión expiró.{" "}
          <Link to="/login" className="underline">
            Vuelve a iniciar sesión
          </Link>
          .
        </div>
      )}
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </div>
  );
}
