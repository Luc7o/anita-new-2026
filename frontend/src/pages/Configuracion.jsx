import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import CuentaLayout from "../components/CuentaLayout.jsx";
import {
  IconLock,
  IconShield,
  IconKey,
  IconEye,
  IconEyeOff,
  IconGlobe,
  IconInfo,
  IconFileText,
  IconRefresh,
  IconUsers,
  IconLogout,
  IconChevronRight,
  IconApple,
  IconPlay,
} from "../components/Icons.jsx";

export default function Configuracion() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [seccionAbierta, setSeccionAbierta] = useState(null);

  const alternarSeccion = (id) => setSeccionAbierta((actual) => (actual === id ? null : id));

  const cerrarSesion = () => {
    logout();
    navigate("/");
  };

  return (
    <CuentaLayout>
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-plum">Seguridad &amp; Privacidad</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TarjetaConfig
              icono={<IconLock size={18} />}
              titulo="Seguridad de la Cuenta"
              descripcion="Contraseña, autenticación y accesos verificados"
              abierta={seccionAbierta === "seguridad"}
              onClick={() => alternarSeccion("seguridad")}
            />
            <TarjetaConfig
              icono={<IconShield size={18} />}
              titulo="Privacidad de Datos"
              descripcion="Preferencias sobre cómo protegemos tu información"
              abierta={seccionAbierta === "privacidad"}
              onClick={() => alternarSeccion("privacidad")}
            />
            <TarjetaConfig
              icono={<IconKey size={18} />}
              titulo="Permisos Autorizados"
              descripcion="Aplicaciones de terceros conectadas"
              abierta={seccionAbierta === "permisos"}
              onClick={() => alternarSeccion("permisos")}
            />
            <TarjetaConfig
              icono={<IconUsers size={18} />}
              titulo="Centro de Seguridad"
              descripcion="Reportar incidentes o bloquear actividades"
              abierta={seccionAbierta === "centro"}
              onClick={() => alternarSeccion("centro")}
            />
          </div>

          {seccionAbierta === "seguridad" && <FormularioContrasena />}
          {(seccionAbierta === "privacidad" ||
            seccionAbierta === "permisos" ||
            seccionAbierta === "centro") && (
            <div className="glass mt-3 rounded-2xl p-5 text-sm text-plum-soft shadow-glass">
              Esta sección estará disponible próximamente.
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-plum">Preferencias del Sistema</h2>
          <div className="glass divide-y divide-plum/10 overflow-hidden rounded-2xl shadow-glass">
            <FilaPreferencia icono={<IconGlobe size={16} />} etiqueta="Idioma" valor="Español (PE)" />
            <FilaPreferencia
              icono={<IconInfo size={16} />}
              etiqueta="Acerca de Anita New Style"
              onClick={() => alternarSeccion("acerca")}
            />
            <FilaPreferencia
              icono={<IconFileText size={16} />}
              etiqueta="Términos y políticas legales"
              onClick={() => alternarSeccion("terminos")}
            />
            <FilaPreferencia
              icono={<IconRefresh size={16} />}
              etiqueta="Cambiar cuenta"
              onClick={() => alternarSeccion("cuenta")}
            />
          </div>
          {(seccionAbierta === "acerca" ||
            seccionAbierta === "terminos" ||
            seccionAbierta === "cuenta") && (
            <div className="glass mt-3 rounded-2xl p-5 text-sm text-plum-soft shadow-glass">
              Esta sección estará disponible próximamente.
            </div>
          )}
        </div>

        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 rounded-full border border-berry/40 px-6 py-2.5 text-sm font-semibold text-berry-dark transition hover:bg-berry/10"
        >
          <IconLogout size={16} />
          Cerrar sesión
        </button>

        {/* Promoción de la app (contenido visual, sin enlaces reales todavía) */}
        <div className="glass flex flex-col items-center gap-6 overflow-hidden rounded-3xl p-6 shadow-glass sm:flex-row sm:p-8">
          <div className="flex-1">
            <span className="mb-3 inline-block rounded-full bg-berry px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Nueva experiencia
            </span>
            <h3 className="text-xl font-semibold text-plum">
              Lleva la moda peruana en tu bolsillo
            </h3>
            <p className="mt-2 max-w-sm text-sm text-plum-soft">
              Descarga nuestra app oficial para iOS y Android. Obtén notificaciones exclusivas,
              ofertas flash y un checkout ultrarrápido desde donde estés.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#"
                className="flex items-center gap-2 rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum/90"
              >
                <IconApple size={16} /> App Store
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-full border border-plum/20 px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-white"
              >
                <IconPlay size={16} /> Google Play
              </a>
            </div>
          </div>
          <div className="flex h-40 w-28 shrink-0 items-start justify-center rounded-[1.75rem] border-4 border-plum/80 bg-white p-1.5 sm:h-48 sm:w-32">
            <div className="h-2 w-10 rounded-full bg-plum/20" />
          </div>
        </div>

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

function FilaPreferencia({ icono, etiqueta, valor, onClick }) {
  const Contenedor = onClick ? "button" : "div";
  return (
    <Contenedor
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-3.5 text-left ${
        onClick ? "transition hover:bg-white/60" : ""
      }`}
    >
      <span className="text-plum-soft">{icono}</span>
      <span className="flex-1 text-sm text-plum">{etiqueta}</span>
      {valor && <span className="text-sm text-plum-soft">{valor}</span>}
      <IconChevronRight size={15} className="text-plum-soft" />
    </Contenedor>
  );
}

function FormularioContrasena() {
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
      await api.cambiarPassword({
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
      });
      setMensaje("Contraseña actualizada correctamente.");
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
      <CampoPassword
        id="config-password-nueva"
        placeholder="Contraseña nueva"
        value={form.password_nueva}
        onChange={(v) => setForm({ ...form, password_nueva: v })}
        visible={verNueva}
        onToggle={() => setVerNueva((v) => !v)}
      />
      <CampoPassword
        id="config-password-confirmar"
        placeholder="Confirmar contraseña nueva"
        value={form.password_confirmar}
        onChange={(v) => setForm({ ...form, password_confirmar: v })}
        visible={verNueva}
        onToggle={() => setVerNueva((v) => !v)}
      />

      <div aria-live="polite">
        {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}
        {mensaje && <p className="text-sm text-berry-dark">{mensaje}</p>}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
      >
        {guardando ? "Actualizando..." : "Actualizar contraseña"}
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
