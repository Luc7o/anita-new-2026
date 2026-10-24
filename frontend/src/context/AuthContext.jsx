import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAccessToken, clearAccessToken, guardarCsrf } from "../api/client.js";

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

  // Cuenta con verificación en dos pasos: el servidor aún no entrega sesión,
  // solo un pase de 5 minutos. Se guarda acá para que la pantalla de ingreso
  // (o el panel) pida el código, venga el login de la contraseña o de Google.
  const [segundoPaso, setSegundoPaso] = useState(null); // null | { token }

  const abrirSesion = (data) => {
    setAccessToken(data.token);
    guardarCsrf(data.csrf);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    setSegundoPaso(null);
    return data.usuario;
  };

  // Devuelve el usuario, o { requiere2fa: true } si falta el código.
  const login = async (email, password) => {
    const data = await api.login({ email, password });
    if (data.requiere_2fa) {
      setSegundoPaso({ token: data.token_2fa });
      return { requiere2fa: true };
    }
    return abrirSesion(data);
  };

  const loginConGoogle = async (credential) => {
    const data = await api.loginGoogle(credential);
    if (data.requiere_2fa) {
      setSegundoPaso({ token: data.token_2fa });
      return { requiere2fa: true };
    }
    return abrirSesion(data);
  };

  const verificarSegundoPaso = async (codigo, recordarDispositivo = false) => {
    const data = await api.login2fa({
      token_2fa: segundoPaso?.token,
      codigo,
      recordar_dispositivo: recordarDispositivo === true,
    });
    const u = abrirSesion(data);
    return { usuario: u, codigosRespaldoRestantes: data.codigos_respaldo_restantes };
  };

  const cancelarSegundoPaso = () => setSegundoPaso(null);

  const registro = async (payload) => {
    const data = await api.registro(payload);
    setAccessToken(data.token);
    guardarCsrf(data.csrf);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  // Registro rápido solo con el correo: el backend crea la cuenta (nombre y
  // contraseña aleatorios) y devuelve sesión, así se puede seguir comprando.
  const registroConEmail = async (email) => {
    const data = await api.registroConEmail(email);
    setAccessToken(data.token);
    guardarCsrf(data.csrf);
    setUsuario(data.usuario);
    setSesionExpirada(false);
    return data.usuario;
  };

  const continuarComoInvitado = async (payload) => {
    const data = await api.continuarComoInvitado(payload);
    setAccessToken(data.token);
    guardarCsrf(data.csrf);
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
        loginConGoogle,
        segundoPaso,
        verificarSegundoPaso,
        cancelarSegundoPaso,
        registro,
        registroConEmail,
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
