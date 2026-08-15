import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconEye, IconEyeOff } from "../components/Icons.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="glass rounded-3xl p-8 shadow-glass-lg">
        <h1 className="font-display text-2xl font-semibold text-plum">Bienvenida de nuevo</h1>
        <p className="mt-1 text-sm text-plum-soft">Ingresa a tu cuenta de Anita New Style.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-plum">Email</label>
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-plum">Contraseña</label>
              <Link to="/olvide-password" className="text-xs font-medium text-berry hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={verPassword ? "text" : "password"}
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 pr-11 text-plum shadow-glass focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {verPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-berry-dark">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-plum-soft">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-berry hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
