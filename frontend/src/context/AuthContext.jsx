import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setTokens, clearTokens } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Cuando el refresh token también expiró (o la sesión se invalidó desde
  // el backend), avisamos una vez en vez de dejar que la app falle en
  // silencio en la siguiente acción del usuario.
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ans_token");
    if (!token) {
      setCargando(false);
      return;
    }
    api
      .perfil()
      .then(setUsuario)
      .catch(() => clearTokens())
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
    setTokens(data.token, data.refresh_token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const registro = async (payload) => {
    const data = await api.registro(payload);
    setTokens(data.token, data.refresh_token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const logout = () => {
    clearTokens();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, sesionExpirada, setSesionExpirada, login, registro, logout, setUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
