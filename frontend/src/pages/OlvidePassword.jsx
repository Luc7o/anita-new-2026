import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import {
  IconMail,
  IconCheckCircle,
  IconFacebook,
  IconInstagram,
  IconWhatsApp,
} from "../components/Icons.jsx";
import loginHero from "../assets/auth/login-hero.jpg";

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
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Columna de marca */}
      <div
        className="relative flex min-h-[320px] flex-col justify-end gap-6 overflow-hidden bg-cover p-6 sm:p-10 lg:w-1/2"
        style={{ backgroundImage: `url(${loginHero})`, backgroundPosition: "18% 20%" }}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">
            Recupera tu
            <br />
            Contraseña
          </h1>
          <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
            No te preocupes. En Anita New Style cuidamos tu cuenta, te ayudamos a recuperar el acceso con unos simples pasos.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a 
              href="https://www.facebook.com/anitanewstyle" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook" 
              className="text-plum-soft transition hover:text-berry"
            >
              <IconFacebook />
            </a>
            <a href="#" aria-label="Instagram" className="text-plum-soft transition hover:text-berry">
              <IconInstagram />
            </a>
            <a href="#" aria-label="WhatsApp" className="text-plum-soft transition hover:text-berry">
              <IconWhatsApp />
            </a>
          </div>
        </div>
      </div>

      {/* Columna de formulario */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 sm:px-16 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          {enviado ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
                <IconCheckCircle size={32} />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-plum sm:text-4xl">
                Revisa tu Correo
              </h2>
              <p className="mt-2 text-sm text-plum-soft">
                Si el correo <strong className="text-plum">{email}</strong> está registrado,
                te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de
                entrada y la carpeta de spam.
              </p>

              <Link
                to="/ingresar"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark"
              >
                Volver a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-semibold text-plum sm:text-4xl">
                  ¿Olvidaste tu Contraseña?
                </h2>
                <p className="mt-2 text-sm text-plum-soft">
                  No te preocupes, ingresa tu correo y te enviaremos un enlace para
                  recuperarla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="olvide-email" className="mb-1.5 block text-sm font-semibold text-plum">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-plum-soft">
                      <IconMail size={18} />
                    </span>
                    <input
                      id="olvide-email"
                      type="email"
                      required
                      maxLength={120}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full rounded-md border border-plum/20 bg-white py-3 pl-11 pr-4 text-plum placeholder:text-plum-soft/50 focus:outline-none focus:border-berry"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-berry-dark" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Enlace de Recuperación"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-plum-soft">
                ¿Recordaste tu contraseña?{" "}
                <Link to="/ingresar" className="font-bold text-berry hover:underline">
                  Inicia sesión.
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}