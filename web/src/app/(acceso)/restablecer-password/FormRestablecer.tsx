"use client";

import { useEffect, useState } from "react";
import { restablecerPassword } from "@/lib/acceso";
import { MedidorPassword } from "@/componentes/acceso/MedidorPassword";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCandado, IconoCheck, IconoOjo, IconoOjoTachado } from "@/componentes/Iconos";

export function FormRestablecer() {
  // El token llega en ?token=… (enlace del correo). Se lee al montar: la página es estática.
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("El enlace no es válido. Solicita uno nuevo.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirmar) return setError("Las contraseñas no coinciden.");
    setEnviando(true);
    try {
      await restablecerPassword(token, password);
      setExito(true);
      setTimeout(() => window.location.assign("/ingresar"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setEnviando(false);
    }
  };

  if (token === null) return <div className="skeleton h-80 rounded-[20px]" aria-hidden="true" />;

  const CANDADO = (
    <span className="pointer-events-none absolute inset-y-0 left-0.5 flex items-center text-plum-soft">
      <IconoCandado size={17} />
    </span>
  );

  if (exito) {
    return (
      <div className="text-center" role="status">
        <span className="exito-aparece mx-auto grid h-20 w-20 place-items-center rounded-full bg-plum text-ivory">
          <IconoCheck size={36} />
        </span>
        <h2 className="mt-6 font-display text-4xl text-plum">Contraseña actualizada</h2>
        <p className="mt-3 text-sm text-plum-soft">Tu contraseña se actualizó correctamente. Te llevamos a la página de ingreso...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="font-display text-4xl text-plum">Enlace no válido</h2>
        <p className="mt-3 text-sm leading-relaxed text-plum-soft">
          Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo para continuar.
        </p>
        <a href="/olvide-password" className="btn-pildora mt-8 w-full">
          Pedir un enlace nuevo
        </a>
      </div>
    );
  }

  const botonVer = (
    <button
      type="button"
      onClick={() => setVerPassword((v) => !v)}
      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-plum-soft hover:text-plum"
      aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
    </button>
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="font-display text-4xl text-plum">Nueva contraseña</h2>
        <p className="mt-2 text-sm text-plum-soft">Crea una contraseña nueva y segura para tu cuenta.</p>
      </div>

      <form onSubmit={enviar} className="space-y-6">
        <div>
          <label htmlFor="restablecer-password" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Contraseña nueva
          </label>
          <div className="relative">
            {CANDADO}
            <input
              id="restablecer-password"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="campo-linea pr-10!"
            />
            {botonVer}
          </div>
          <MedidorPassword password={password} />
        </div>

        <div>
          <label htmlFor="restablecer-confirmar" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Confirmar contraseña
          </label>
          <div className="relative">
            {CANDADO}
            <input
              id="restablecer-confirmar"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              maxLength={72}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="campo-linea pr-10!"
            />
            {botonVer}
          </div>
          {confirmar && (
            <p className={`mt-1.5 text-xs ${confirmar === password ? "font-medium text-exito" : "text-peligro"}`} aria-live="polite">
              {confirmar === password ? "✓ Las contraseñas coinciden." : "Las contraseñas aún no coinciden."}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-peligro" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className="btn-pildora w-full">
          {enviando ? <><Girando />Guardando...</> : "Guardar contraseña"}
        </button>
      </form>
    </>
  );
}
