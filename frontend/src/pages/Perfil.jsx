import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconEye, IconEyeOff } from "../components/Icons.jsx";
import { soloTexto, soloNumeros } from "../validacion.js";

export default function Perfil() {
  const { usuario, setUsuario } = useAuth();
  const [form, setForm] = useState({
    nombre: "", apellido: "", telefono: "",
    direccion: "", distrito: "", provincia: "", departamento: "", referencia: "",
  });
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState("");
  const [errorDatos, setErrorDatos] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    password_actual: "", password_nueva: "", password_confirmar: "",
  });
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  useEffect(() => {
    api.perfil().then((data) => {
      setForm({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        distrito: data.distrito || "",
        provincia: data.provincia || "",
        departamento: data.departamento || "",
        referencia: data.referencia || "",
      });
    });
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefono = (e) => setForm({ ...form, telefono: soloNumeros(e.target.value) });

  const guardarDatos = async (e) => {
    e.preventDefault();
    setErrorDatos("");
    setMensajeDatos("");
    setGuardandoDatos(true);
    try {
      const actualizado = await api.actualizarPerfil(form);
      setUsuario(actualizado);
      setMensajeDatos("Tus datos se guardaron correctamente.");
    } catch (err) {
      setErrorDatos(err.message);
    } finally {
      setGuardandoDatos(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword("");
    setMensajePassword("");

    if (passwordForm.password_nueva !== passwordForm.password_confirmar) {
      setErrorPassword("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setGuardandoPassword(true);
    try {
      await api.cambiarPassword({
        password_actual: passwordForm.password_actual,
        password_nueva: passwordForm.password_nueva,
      });
      setMensajePassword("Contraseña actualizada correctamente.");
      setPasswordForm({ password_actual: "", password_nueva: "", password_confirmar: "" });
    } catch (err) {
      setErrorPassword(err.message);
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (!usuario) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-plum-soft">Ingresa para ver tu perfil.</p>;
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 pb-16">
      <h1 className="font-display text-3xl font-semibold text-plum">Mi perfil</h1>

      {/* Datos personales */}
      <form onSubmit={guardarDatos} className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="font-display text-lg font-semibold text-plum">Datos personales</h2>

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Nombre"
            required
            maxLength={80}
            value={form.nombre}
            onChange={actualizarTexto("nombre")}
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Apellido"
            required
            maxLength={80}
            value={form.apellido}
            onChange={actualizarTexto("apellido")}
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
        </div>
        <input
          placeholder="Teléfono"
          required
          inputMode="numeric"
          maxLength={9}
          value={form.telefono}
          onChange={actualizarTelefono}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />
        <input
          placeholder="Dirección"
          required
          maxLength={200}
          value={form.direccion}
          onChange={actualizarCampo("direccion")}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Distrito"
            required
            maxLength={100}
            value={form.distrito}
            onChange={actualizarTexto("distrito")}
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Provincia"
            required
            maxLength={100}
            value={form.provincia}
            onChange={actualizarTexto("provincia")}
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Departamento"
            required
            maxLength={100}
            value={form.departamento}
            onChange={actualizarTexto("departamento")}
            className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
        </div>
        <input
          placeholder="Referencia"
          required
          maxLength={200}
          value={form.referencia}
          onChange={actualizarCampo("referencia")}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />

        {errorDatos && <p className="text-sm text-berry-dark">{errorDatos}</p>}
        {mensajeDatos && <p className="text-sm text-berry-dark">{mensajeDatos}</p>}

        <button
          type="submit"
          disabled={guardandoDatos}
          className="rounded-full bg-berry px-6 py-2.5 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
        >
          {guardandoDatos ? "Guardando..." : "Guardar datos"}
        </button>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={cambiarPassword} className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="font-display text-lg font-semibold text-plum">Cambiar contraseña</h2>

        <PasswordInput
          placeholder="Contraseña actual"
          value={passwordForm.password_actual}
          onChange={(v) => setPasswordForm({ ...passwordForm, password_actual: v })}
          visible={verActual}
          onToggle={() => setVerActual((v) => !v)}
        />
        <PasswordInput
          placeholder="Contraseña nueva"
          value={passwordForm.password_nueva}
          onChange={(v) => setPasswordForm({ ...passwordForm, password_nueva: v })}
          visible={verNueva}
          onToggle={() => setVerNueva((v) => !v)}
        />
        <PasswordInput
          placeholder="Confirmar contraseña nueva"
          value={passwordForm.password_confirmar}
          onChange={(v) => setPasswordForm({ ...passwordForm, password_confirmar: v })}
          visible={verNueva}
          onToggle={() => setVerNueva((v) => !v)}
        />

        {errorPassword && <p className="text-sm text-berry-dark">{errorPassword}</p>}
        {mensajePassword && <p className="text-sm text-berry-dark">{mensajePassword}</p>}

        <button
          type="submit"
          disabled={guardandoPassword}
          className="rounded-full bg-berry px-6 py-2.5 font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
        >
          {guardandoPassword ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}

function PasswordInput({ placeholder, value, onChange, visible, onToggle }) {
  return (
    <div className="relative">
      <input
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
