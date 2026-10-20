import { useToast } from "../context/ToastContext.jsx";
import Spinner from "../components/Spinner.jsx";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAccessToken, guardarCsrf } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import MedidorPassword from "../components/MedidorPassword.jsx";
import {
  IconLock,
  IconShield,
  IconEye,
  IconEyeOff,
  IconGlobe,
  IconFileText,
  IconLogout,
  IconChevronRight,
} from "../components/Icons.jsx";

export default function Configuracion() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [seguridadAbierta, setSeguridadAbierta] = useState(false);

  const cerrarSesion = () => {
    logout();
    navigate("/");
  };

  return (
    <CuentaLayout>
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-plum">Seguridad</h2>
          <TarjetaConfig
            icono={<IconLock size={18} />}
            titulo="Seguridad de la Cuenta"
            descripcion="Cambia tu contraseña"
            abierta={seguridadAbierta}
            onClick={() => setSeguridadAbierta((v) => !v)}
          />
          {seguridadAbierta && <FormularioContrasena />}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-plum">Preferencias del Sistema</h2>
          <div className="glass divide-y divide-plum/10 overflow-hidden rounded-2xl shadow-glass">
            <FilaPreferencia icono={<IconGlobe size={16} />} etiqueta="Idioma" valor="Español (PE)" />
            <FilaPreferencia
              icono={<IconShield size={16} />}
              etiqueta="Política de privacidad"
              to="/politica-de-privacidad"
            />
            <FilaPreferencia
              icono={<IconFileText size={16} />}
              etiqueta="Términos y condiciones"
              to="/terminos-y-condiciones"
            />
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 rounded-full border border-berry/40 px-6 py-2.5 text-sm font-semibold text-berry-dark transition hover:bg-berry/10"
        >
          <IconLogout size={16} />
          Cerrar sesión
        </button>
      </div>
    </CuentaLayout>
  );
}

function TarjetaConfig({ icono, titulo, descripcion, abierta, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={abierta}
      className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left shadow-glass transition ${
        abierta ? "border-berry/40 bg-white" : "border-transparent bg-white/60 hover:bg-white"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-berry/10 text-berry-dark">
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-plum">{titulo}</span>
        <span className="block truncate text-xs text-plum-soft">{descripcion}</span>
      </span>
      <IconChevronRight size={16} className="shrink-0 text-plum-soft" />
    </button>
  );
}

function FilaPreferencia({ icono, etiqueta, valor, to }) {
  const Contenedor = to ? Link : "div";
  const props = to ? { to } : {};
  return (
    <Contenedor
      {...props}
      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left ${
        to ? "transition hover:bg-white/60" : ""
      }`}
    >
      <span className="text-plum-soft">{icono}</span>
      <span className="flex-1 text-sm text-plum">{etiqueta}</span>
      {valor && <span className="text-sm text-plum-soft">{valor}</span>}
      {to && <IconChevronRight size={15} className="text-plum-soft" />}
    </Contenedor>
  );
}

function FormularioContrasena() {
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
