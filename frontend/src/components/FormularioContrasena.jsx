import React, { useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import Spinner from "./Spinner.jsx";
import { api, setAccessToken, guardarCsrf } from "../api/client.js";
import MedidorPassword from "./MedidorPassword.jsx";
import { IconEye, IconEyeOff } from "./Icons.jsx";

// Formulario "Cambiar contraseña" (con la barra de seguridad). Vive en Mi Cuenta > Perfil.
export default function FormularioContrasena() {
  const toast = useToast();
  const [form, setForm] = useState({ password_actual: "", password_nueva: "", password_confirmar: "" });
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (form.password_nueva !== form.password_confirmar) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await api.cambiarPassword({
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
      });
      // El backend invalida la sesión en cualquier OTRO dispositivo al
      // cambiar la contraseña, pero nos da un token nuevo para que esta
      // misma pestaña siga funcionando sin pedir volver a loguearse.
      setAccessToken(respuesta.token);
      guardarCsrf(respuesta.csrf);
      toast.success("Contraseña actualizada correctamente");
      setForm({ password_actual: "", password_nueva: "", password_confirmar: "" });
    } catch (err) {
      setError(err.message);
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
        value={form.password_actual}
        onChange={(v) => setForm({ ...form, password_actual: v })}
        visible={verActual}
        onToggle={() => setVerActual((v) => !v)}
      />
      <div>
        <CampoPassword
          id="config-password-nueva"
          placeholder="Contraseña nueva"
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
          value={form.password_confirmar}
          onChange={(v) => setForm({ ...form, password_confirmar: v })}
          visible={verNueva}
          onToggle={() => setVerNueva((v) => !v)}
        />
        {form.password_confirmar && (
          <p
            className={`mt-1.5 text-xs ${form.password_confirmar === form.password_nueva ? "font-medium text-green-700" : "text-berry-dark"}`}
            aria-live="polite"
          >
            {form.password_confirmar === form.password_nueva ? "✓ Las contraseñas coinciden." : "Las contraseñas aún no coinciden."}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}
        {mensaje && <p className="text-sm text-berry-dark">{mensaje}</p>}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
      >
        {guardando ? <><Spinner />Actualizando...</> : "Actualizar contraseña"}
      </button>
    </form>
  );
}

function CampoPassword({ id, placeholder, value, onChange, visible, onToggle }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required
        maxLength={72}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-white/70 px-4 py-2.5 pr-11 text-plum shadow-glass focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-3 flex items-center text-plum-soft hover:text-berry"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
