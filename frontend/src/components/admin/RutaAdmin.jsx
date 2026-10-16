import CargandoPagina from "../CargandoPagina.jsx";
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES_ADMIN } from "../../roles.js";
import { IS_ADMIN_APP, TIENDA_URL } from "../../lib/appMode.js";

export default function RutaAdmin({ children }) {
  const { usuario, cargando, logout } = useAuth();

  if (cargando) {
    return <CargandoPagina />;
  }
  if (!usuario) {
    // En el subdominio del admin el login vive en "/login"; en la tienda, en "/ingresar".
    return <Navigate to={IS_ADMIN_APP ? "/login" : "/ingresar"} replace />;
  }
  if (!ROLES_ADMIN.includes(usuario.rol)) {
    if (!IS_ADMIN_APP) return <Navigate to="/" replace />;
    // Una cuenta de cliente que llega al panel no tiene a dónde volver dentro de
    // esta app (aquí no hay tienda), así que se le explica y se le deja salir.
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <div className="panel w-full max-w-md p-8 text-center">
          <h1 className="font-display text-2xl text-plum">Sin acceso al panel</h1>
          <p className="mt-3 text-sm text-plum-soft">
            Esta cuenta no tiene permisos de administración. Inicia sesión con otra cuenta.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={logout} className="btn btn-primary">
              Cambiar de cuenta
            </button>
            {TIENDA_URL && (
              <a href={TIENDA_URL} className="btn btn-secondary">
                Ir a la tienda
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
  return children;
}
