"use client";

import { useState } from "react";
import { pedirEnlaceRecuperacion } from "@/lib/acceso";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCirculoCheck, IconoCorreo } from "@/componentes/Iconos";

export function FormOlvide() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await pedirEnlaceRecuperacion(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el enlace");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
          <IconoCirculoCheck size={32} />
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-plum sm:text-4xl">Revisa tu Correo</h2>
        <p className="mt-2 text-sm text-plum-soft">
          Si el correo <strong className="text-plum">{email}</strong> está registrado, te enviamos un enlace para restablecer
          tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
        </p>
        <a
          href="/ingresar"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark"
        >
          Volver a Iniciar Sesión
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold text-plum sm:text-4xl">¿Olvidaste tu Contraseña?</h2>
        <p className="mt-2 text-sm text-plum-soft">
          No te preocupes, ingresa tu correo y te enviaremos un enlace para recuperarla.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-6">
        <div>
          <label htmlFor="olvide-email" className="mb-1.5 block text-sm font-semibold text-plum">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-plum-soft">
              <IconoCorreo size={18} />
            </span>
            <input
              id="olvide-email"
              type="email"
              required
              autoComplete="email"
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full rounded-md border border-plum/20 bg-white py-3 pl-11 pr-4 text-plum placeholder:text-plum-soft/50 focus:border-berry focus:outline-hidden"
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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
        >
          {enviando ? <><Girando />Enviando...</> : "Enviar Enlace de Recuperación"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-plum-soft">
        ¿Recordaste tu contraseña?{" "}
        <a href="/ingresar" className="font-bold text-berry hover:underline">
          Inicia sesión.
        </a>
      </p>
    </>
  );
}
