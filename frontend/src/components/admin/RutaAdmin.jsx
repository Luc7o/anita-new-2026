import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES_ADMIN } from "../../roles.js";

export default function RutaAdmin({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-plum-soft">Cargando...</p>;
  }
  if (!usuario) {
    return <Navigate to="/ingresar" replace />;
  }
  if (!ROLES_ADMIN.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
