"use client";

import { useState } from "react";
import { guardarSesion, pedir } from "@/lib/api";
import { MedidorPassword } from "@/componentes/acceso/MedidorPassword";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoOjo, IconoOjoTachado } from "@/componentes/Iconos";
import { useSesion } from "./Sesion";

const VACIO = { password_actual: "", password_nueva: "", password_confirmar: "" };

function CampoPassword({ id, placeholder, value, onChange, visible, onToggle, autoComplete }: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required
        maxLength={72}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-white/70 px-4 py-2.5 pr-11 text-plum shadow-glass focus:outline-hidden"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <IconoOjoTachado /> : <IconoOjo />}
      </button>
    </div>
  );
}

// Cambiar contraseña (Mi cuenta > Perfil), con la barra de seguridad.
export function FormularioContrasena() {
  const { avisar } = useSesion();
  const [form, setForm] = useState(VACIO);
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password_nueva !== form.password_confirmar) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    setGuardando(true);
    try {
      // El backend cierra la sesión en los OTROS dispositivos y devuelve un token nuevo
      // para que esta pestaña siga funcionando.
      const r = await pedir<{ token: string; csrf?: string }>("/auth/cambiar-password", {
        method: "PUT",
        body: { password_actual: form.password_actual, password_nueva: form.password_nueva },
        auth: true,
      });
      guardarSesion(r.token, r.csrf);
      avisar("success", "Contraseña actualizada correctamente");
      setForm(VACIO);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="glass mt-3 space-y-4 rounded-2xl p-5 shadow-glass sm:p-6">
      <h3 className="text-base font-semibold text-plum">Cambiar contraseña</h3>
      <CampoPassword
        id="config-password-actual"
        placeholder="Contraseña actual"
        autoComplete="current-password"
        value={form.password_actual}
        onChange={(v) => setForm({ ...form, password_actual: v })}
        visible={verActual}
        onToggle={() => setVerActual((v) => !v)}
      />
      <div>
        <CampoPassword
          id="config-password-nueva"
          placeholder="Contraseña nueva"
          autoComplete="new-password"
          value={form.password_nueva}
          onChange={(v) => setForm({ ...form, password_nueva: v })}
          visible={verNueva}
          onToggle={() => setVerNueva((v) => !v)}
        />
        <MedidorPassword password={form.password_nueva} />
      </div>
      <div>
        <CampoPassword
          id="config-password-confirmar"
          placeholder="Confirmar contraseña nueva"
          autoComplete="new-password"
          value={form.password_confirmar}
          onChange={(v) => setForm({ ...form, password_confirmar: v })}
          visible={verNueva}
          onToggle={() => setVerNueva((v) => !v)}
        />
        {form.password_confirmar && (
          <p
            className={`mt-1.5 text-xs ${form.password_confirmar === form.password_nueva ? "font-medium text-exito" : "text-berry-dark"}`}
            aria-live="polite"
          >
            {form.password_confirmar === form.password_nueva ? "✓ Las contraseñas coinciden." : "Las contraseñas aún no coinciden."}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="inline-flex items-center gap-2 rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
      >
        {guardando ? <><Girando />Actualizando...</> : "Actualizar contraseña"}
      </button>
    </form>
  );
}
