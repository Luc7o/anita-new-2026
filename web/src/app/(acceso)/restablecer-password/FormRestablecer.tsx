"use client";

import { useEffect, useState } from "react";
import { restablecerPassword } from "@/lib/acceso";
import { MedidorPassword } from "@/componentes/acceso/MedidorPassword";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCirculoCheck, IconoOjo, IconoOjoTachado } from "@/componentes/Iconos";

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

  if (exito) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lilac text-berry">
          <IconoCirculoCheck size={32} />
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-plum sm:text-4xl">¡Contraseña Actualizada!</h2>
        <p className="mt-2 text-sm text-plum-soft">Tu contraseña se actualizó correctamente. Te llevamos a la página de ingreso...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-plum sm:text-4xl">Enlace no Válido</h2>
        <p className="mt-2 text-sm text-plum-soft">
          Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo para continuar.
        </p>
        <a
          href="/olvide-password"
          className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-plum py-3.5 font-semibold text-white transition hover:bg-berry-dark"
        >
          Solicitar Nuevo Enlace
        </a>
      </div>
    );
  }

  const botonVer = (
    <button
      type="button"
      onClick={() => setVerPassword((v) => !v)}
      className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
      aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {verPassword ? <IconoOjoTachado /> : <IconoOjo />}
    </button>
  );

  return (
    <>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold text-plum sm:text-4xl">Nueva Contraseña</h2>
        <p className="mt-2 text-sm text-plum-soft">Crea una contraseña nueva y segura para tu cuenta.</p>
      </div>

      <form onSubmit={enviar} className="space-y-6">
        <div>
          <label htmlFor="restablecer-password" className="mb-1.5 block text-sm font-semibold text-plum">
            Contraseña Nueva
          </label>
          <div className="relative">
            <input
              id="restablecer-password"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="campo-texto pr-11"
            />
            {botonVer}
          </div>
          <MedidorPassword password={password} />
        </div>

        <div>
          <label htmlFor="restablecer-confirmar" className="mb-1.5 block text-sm font-semibold text-plum">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              id="restablecer-confirmar"
              type={verPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              maxLength={72}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="campo-texto pr-11"
            />
            {botonVer}
          </div>
          {confirmar && (
            <p className={`mt-1.5 text-xs ${confirmar === password ? "font-medium text-exito" : "text-berry-dark"}`} aria-live="polite">
              {confirmar === password ? "✓ Las contraseñas coinciden." : "Las contraseñas aún no coinciden."}
            </p>
          )}
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
          {enviando ? <><Girando />Guardando...</> : "Restablecer Contraseña"}
        </button>
      </form>
    </>
  );
}
