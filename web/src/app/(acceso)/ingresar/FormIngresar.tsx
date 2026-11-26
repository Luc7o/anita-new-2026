"use client";

import { useEffect, useState } from "react";
import { destinoTrasIngresar, ingresar, verificarSegundoPaso, type ResultadoIngreso } from "@/lib/acceso";
import { BotonGoogle, HAY_GOOGLE } from "@/componentes/acceso/BotonGoogle";
import { PasoDosFactores } from "@/componentes/acceso/PasoDosFactores";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCandado, IconoCorreo, IconoOjo, IconoOjoTachado } from "@/componentes/Iconos";

const CLAVE_RECORDAR = "ans_recordar_email"; // clave histórica: conserva el correo ya recordado

function leerRecordado() {
  try {
    return localStorage.getItem(CLAVE_RECORDAR) || "";
  } catch {
    return "";
  }
}

function guardarRecordado(recordar: boolean, email: string) {
  try {
    if (recordar) localStorage.setItem(CLAVE_RECORDAR, email);
    else localStorage.removeItem(CLAVE_RECORDAR);
  } catch {
    // sin localStorage: no se recuerda
  }
}

/** onOlvide: dentro de la tarjeta de acceso, cambia a "recuperar contraseña" deslizando el panel. */
export function FormIngresar({ onOlvide }: { onOlvide?: () => void } = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pase2fa, setPase2fa] = useState<string | null>(null);

  // El correo recordado se lee después de montar (en el servidor no hay localStorage).
  useEffect(() => {
    const guardado = leerRecordado();
    if (guardado) {
      setEmail(guardado);
      setRecordar(true);
    }
  }, []);

  const terminar = () => {
    guardarRecordado(recordar, email);
    window.location.assign(destinoTrasIngresar());
  };

  const alIngresar = (r: ResultadoIngreso) => {
    if ("pase2fa" in r) {
      setPase2fa(r.pase2fa);
      setEnviando(false);
      return;
    }
    terminar();
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      alIngresar(await ingresar(email.trim(), password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
      setEnviando(false);
    }
  };

  if (pase2fa) {
    return (
      <PasoDosFactores
        onVerificar={(codigo, recordarDispositivo) => verificarSegundoPaso(pase2fa, codigo, recordarDispositivo)}
        onListo={terminar}
        onCancelar={() => setPase2fa(null)}
      />
    );
  }

  return (
    <>
      <div className="mb-8 bajo:mb-5">
        <h2 className="font-display text-4xl text-plum bajo:text-[2rem]">Iniciar sesión</h2>
        <p className="mt-2 text-sm text-plum-soft">Con el correo y la contraseña de tu cuenta.</p>
      </div>

      <form onSubmit={enviar} className="space-y-6 bajo:space-y-4">
        <div>
          <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Correo electrónico
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0.5 flex items-center text-plum-soft">
              <IconoCorreo size={17} />
            </span>
            <input
              id="login-email"
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

        <div>
          <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Contraseña
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0.5 flex items-center text-plum-soft">
              <IconoCandado size={17} />
            </span>
            <input
              id="login-password"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="campo-linea pr-10!"
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-plum-soft hover:text-plum"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-plum-soft transition-colors hover:text-plum">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
              className="h-4 w-4 rounded-sm accent-berry"
            />
            Recordarme
          </label>
          <a
            href="/olvide-password"
            onClick={(e) => {
              if (!onOlvide) return;
              e.preventDefault();
              onOlvide();
            }}
            className="font-semibold text-berry hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error && (
          <p className="text-sm text-berry-dark" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-pildora w-full">
          {enviando ? <><Girando />Ingresando...</> : "Ingresar"}
        </button>
      </form>

      {HAY_GOOGLE && (
        <>
          <div className="my-6 flex items-center gap-3 bajo:my-3 text-xs font-medium uppercase tracking-wide text-plum-soft">
            <span className="h-px flex-1 bg-plum/10" />o<span className="h-px flex-1 bg-plum/10" />
          </div>
          {/* Sin casilla de Términos: aquí Google solo sirve para cuentas que ya existen (las nuevas se crean en Crear cuenta). */}
          <BotonGoogle texto="signin_with" onResultado={alIngresar} onError={setError} />
        </>
      )}

      <p className="mt-7 text-center text-sm bajo:mt-4">
        <a href="/tienda" className="font-medium text-plum-soft transition hover:text-plum hover:underline">
          Seguir comprando sin cuenta
        </a>
      </p>
    </>
  );
}
