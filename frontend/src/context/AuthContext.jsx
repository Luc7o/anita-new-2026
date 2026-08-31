import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken, clearAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Cuando el refresh token también expiró (o la sesión se invalidó desde
  // el backend), avisamos una vez en vez de dejar que la app falle en
  // silencio en la siguiente acción del usuario.
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    // El access token vive en memoria y se pierde al recargar la página, así
    // que al montar la app intentamos recuperarlo pidiendo uno nuevo con la
    // cookie httpOnly de refresh (si no existe o expiró, esto simplemente
    // falla y el usuario queda como no logueado, sin error visible).
    api
      .refrescarToken()
      .then(() => api.perfil())
      .then(setUsuario)
      .catch(() => clearAccessToken())
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const alExpirar = () => {
      setUsuario(null);
      setSesionExpirada(true);
    };
    window.addEventListener("ans:sesion-expirada", alExpirar);
    return () => window.removeEventListener("ans:sesion-expirada", alExpirar);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAccessToken(data.token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const registro = async (payload) => {
    const data = await api.registro(payload);
    setAccessToken(data.token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const continuarComoInvitado = async (payload) => {
    const data = await api.continuarComoInvitado(payload);
    setAccessToken(data.token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const logout = () => {
    api.logout().catch(() => {}); // limpia la cookie en el servidor; si falla, igual limpiamos local
    clearAccessToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        sesionExpirada,
        setSesionExpirada,
        login,
        registro,
        continuarComoInvitado,
        logout,
        setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
