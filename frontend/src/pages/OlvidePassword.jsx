import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function OlvidePassword() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await api.olvidePassword(email);
      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="glass rounded-3xl p-8 shadow-glass-lg">
        <h1 className="font-display text-2xl font-semibold text-plum">Recupera tu contraseña</h1>

        {enviado ? (
          <p className="mt-4 text-sm text-plum-soft">
            Si el correo <strong>{email}</strong> está registrado, te enviamos las
            instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-plum-soft">
              Ingresa tu email y te enviaremos un enlace para restablecerla.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                required
                maxLength={120}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              {error && <p className="text-sm text-berry-dark">{error}</p>}
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>
          </>
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
