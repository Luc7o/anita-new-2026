"use client";

import { useEffect, useState } from "react";
import { destinoTrasIngresar, ingresar, verificarSegundoPaso, type ResultadoIngreso } from "@/lib/acceso";
import { BotonGoogle, GOOGLE_CLIENT_ID } from "@/componentes/acceso/BotonGoogle";
import { PasoDosFactores } from "@/componentes/acceso/PasoDosFactores";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoOjo, IconoOjoTachado } from "@/componentes/Iconos";

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

export function FormIngresar() {
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
        onVerificar={async (codigo, recordarDispositivo) => {
          await verificarSegundoPaso(pase2fa, codigo, recordarDispositivo);
          terminar();
        }}
        onCancelar={() => setPase2fa(null)}
      />
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold text-plum sm:text-4xl">Iniciar Sesión</h2>
        <p className="mt-3 text-sm text-plum-soft">
          ¿Aún no tienes cuenta?{" "}
          <a href="/registro" className="font-semibold text-berry hover:underline">
            Crea una cuenta solo con tu correo
          </a>
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-6">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-plum">
            Correo electrónico
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            maxLength={120}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-plum placeholder:text-plum-soft/50 focus:outline-hidden"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="block text-sm font-semibold text-plum">
              Contraseña
            </label>
            <a href="/olvide-password" className="text-xs font-medium text-berry hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 pr-11 text-plum focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-plum transition-colors hover:text-berry">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="h-4 w-4 rounded-sm border-plum/20 accent-berry"
          />
          Recordarme en este dispositivo
        </label>

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
          {enviando ? <><Girando />Ingresando...</> : "Ingresar"}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-plum-soft/70">
            <span className="h-px flex-1 bg-plum/10" />o<span className="h-px flex-1 bg-plum/10" />
          </div>
          <BotonGoogle texto="signin_with" onResultado={alIngresar} onError={setError} />
        </>
      )}

      <p className="mt-8 text-center text-sm">
        <a href="/tienda" className="font-medium text-plum-soft transition hover:text-berry hover:underline">
          Seguir comprando sin cuenta
        </a>
      </p>
    </>
  );
}
