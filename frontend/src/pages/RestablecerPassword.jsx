import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconEye, IconEyeOff } from "../components/Icons.jsx";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }

    setEnviando(true);
    try {
      await api.restablecerPassword({ token, password_nueva: password });
      setExito(true);
      setTimeout(() => navigate("/ingresar"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="glass rounded-3xl p-8 shadow-glass-lg">
        <h1 className="font-display text-2xl font-semibold text-plum">Nueva contraseña</h1>

        {exito ? (
          <p className="mt-4 text-sm text-plum-soft">
            Tu contraseña se actualizó correctamente. Te llevamos a la página de ingreso...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <input
                type={verPassword ? "text" : "password"}
                required
                maxLength={72}
                placeholder="Contraseña nueva"
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
            <input
              type={verPassword ? "text" : "password"}
              required
              maxLength={72}
              placeholder="Confirmar contraseña nueva"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />

            {error && <p className="text-sm text-berry-dark">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
            >
              {enviando ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-plum-soft">
          <Link to="/ingresar" className="font-medium text-berry hover:underline">
            Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
