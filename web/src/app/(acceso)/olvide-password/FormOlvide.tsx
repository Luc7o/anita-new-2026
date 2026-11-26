"use client";

import { useState } from "react";
import { pedirEnlaceRecuperacion } from "@/lib/acceso";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCheck, IconoCorreo } from "@/componentes/Iconos";

/** onVolver: dentro de la tarjeta de acceso, vuelve a "iniciar sesión" deslizando el panel. */
export function FormOlvide({ onVolver }: { onVolver?: () => void } = {}) {
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
        <span className="exito-aparece mx-auto grid h-20 w-20 place-items-center rounded-full bg-plum text-ivory">
          <IconoCheck size={36} />
        </span>
        <h2 className="mt-6 font-display text-4xl text-plum">Revisa tu correo</h2>
        <p className="mt-3 text-sm leading-relaxed text-plum-soft">
          Si <strong className="text-plum">{email}</strong> está registrado, te enviamos un enlace para elegir una
          contraseña nueva. Mira también la carpeta de spam.
        </p>
        <a
          href="/ingresar"
          onClick={(e) => {
            if (!onVolver) return;
            e.preventDefault();
            onVolver();
          }}
          className="btn-pildora mt-8 w-full"
        >
          Volver a iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 bajo:mb-5">
        <h2 className="font-display text-4xl text-plum bajo:text-[2rem]">¿Olvidaste tu contraseña?</h2>
        <p className="mt-2 text-sm leading-relaxed text-plum-soft">
          Escribe tu correo y te enviaremos un enlace para recuperarla.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-6">
        <div>
          <label htmlFor="olvide-email" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0.5 flex items-center text-plum-soft">
              <IconoCorreo size={17} />
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
              className="campo-linea"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-peligro" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-pildora w-full">
          {enviando ? <><Girando />Enviando...</> : "Enviar enlace"}
        </button>
      </form>
    </>
  );
}
