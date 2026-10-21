import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { ROLES_ADMIN } from "../roles.js";
import Logo from "../components/Logo.jsx";
import Spinner from "../components/Spinner.jsx";
import PasoDosFactores from "../components/PasoDosFactores.jsx";
import { IconEye, IconEyeOff } from "../components/Icons.jsx";

// Inicio de sesión del panel (solo en el subdominio del admin). Sin registro,
// sin Google y sin recomendaciones de tienda: solo entra personal autorizado.
export default function AdminLogin() {
  const { usuario, login, logout, segundoPaso, verificarSegundoPaso, cancelarSegundoPaso } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario && ROLES_ADMIN.includes(usuario.rol)) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const u = await login(email.trim(), password);
      if (u?.requiere2fa) return; // falta el código de la app: se pide abajo
      if (!ROLES_ADMIN.includes(u?.rol)) {
        // Se cierra la sesión recién abierta: una cuenta de cliente no debe
        // quedar iniciada en el panel.
        logout();
        setError("Esta cuenta no tiene acceso al panel de administración.");
        return;
      }
      toast.success("Sesión iniciada");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  const verificarCodigo = async (codigo) => {
    const { usuario: u } = await verificarSegundoPaso(codigo);
    if (!ROLES_ADMIN.includes(u?.rol)) {
      logout();
      cancelarSegundoPaso();
      setError("Esta cuenta no tiene acceso al panel de administración.");
      return;
    }
    toast.success("Sesión iniciada");
    navigate("/", { replace: true });
  };

  return (
    <div className="admin-ui flex min-h-screen flex-col items-center justify-center bg-plum px-4 py-10">
      <div className="mb-8">
        <Logo tone="light" />
      </div>
      {segundoPaso ? (
        <div className="panel w-full max-w-sm p-6 sm:p-8">
          <PasoDosFactores estilo="panel" onVerificar={verificarCodigo} onCancelar={cancelarSegundoPaso} />
        </div>
      ) : (
      <form onSubmit={enviar} className="panel w-full max-w-sm space-y-5 p-6 sm:p-8" noValidate>
        <div>
          <h1 className="text-2xl font-semibold text-plum">Panel de administración</h1>
          <p className="mt-1 text-sm text-plum-soft">Ingresa con tu cuenta de personal.</p>
        </div>

        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-plum">
            Correo
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-plum focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-plum">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={ver ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 pr-12 text-plum focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-plum-soft hover:text-plum"
            >
              {ver ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-berry/10 px-3 py-2 text-sm text-berry-dark">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn btn-primary w-full">
          {enviando && <Spinner />}
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      )}
    </div>
  );
}
