import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { soloTexto } from "../../validacion.js";

const VACIO = { nombre: "", apellido: "", email: "", password: "", rol: "editor" };

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState({});
  const [filtroRol, setFiltroRol] = useState("");
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = (rol = "") =>
    api.adminUsuarios(rol ? { rol } : {}).then(setUsuarios);

  useEffect(() => {
    api.adminRolesDisponibles().then(setRoles);
    cargarUsuarios();
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api.adminCrearUsuarioStaff(form);
      setMostrarForm(false);
      setForm(VACIO);
      cargarUsuarios(filtroRol);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRol = async (usuario, nuevoRol) => {
    await api.adminCambiarRol(usuario.id, nuevoRol);
    cargarUsuarios(filtroRol);
  };

  const cambiarEstado = async (usuario) => {
    await api.adminCambiarEstadoUsuario(usuario.id, !usuario.activo);
    cargarUsuarios(filtroRol);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-plum">Usuarios y roles</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
        >
          + Nuevo miembro del staff
        </button>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setFiltroRol("");
            cargarUsuarios("");
          }}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass ${
            filtroRol === "" ? "bg-berry text-white" : "glass text-plum"
          }`}
        >
          Todos
        </button>
        {Object.entries(roles).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => {
              setFiltroRol(valor);
              cargarUsuarios(valor);
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass ${
              filtroRol === valor ? "bg-berry text-white" : "glass text-plum"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="glass overflow-hidden rounded-3xl shadow-glass">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-white/40">
                <td className="px-4 py-3 font-medium text-plum">{u.nombre_completo}</td>
                <td className="px-4 py-3 text-plum-soft">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                    className="rounded-full bg-white/70 px-3 py-1 text-xs text-plum shadow-glass focus:outline-none"
                  >
                    {Object.entries(roles).map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.activo !== false ? "bg-berry/10 text-berry-dark" : "bg-plum/10 text-plum-soft"
                    }`}
                  >
                    {u.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => cambiarEstado(u)} className="text-plum-soft hover:text-berry">
                    {u.activo !== false ? "Desactivar" : "Reactivar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No hay usuarios con ese filtro.</p>
        )}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-plum/30 backdrop-blur-sm"
            onClick={() => setMostrarForm(false)}
            aria-label="Cerrar"
          />
          <form
            onSubmit={crear}
            className="glass-strong relative w-full max-w-md rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 className="mb-4 font-display text-xl font-semibold text-plum">Nuevo miembro del staff</h2>

            <div className="space-y-3">
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
                type="email"
                placeholder="Email"
                required
                maxLength={120}
                value={form.email}
                onChange={actualizarCampo("email")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                type="password"
                placeholder="Contraseña temporal"
                required
                minLength={6}
                maxLength={72}
                value={form.password}
                onChange={actualizarCampo("password")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <select
                value={form.rol}
                onChange={actualizarCampo("rol")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              >
                {Object.entries(roles)
                  .filter(([valor]) => valor !== "cliente")
                  .map(([valor, label]) => (
                    <option key={valor} value={valor}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>

            {error && <p className="mt-3 text-sm text-berry-dark">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardando ? "Creando..." : "Crear usuario"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="rounded-full bg-white/70 px-5 py-2.5 text-sm font-semibold text-plum shadow-glass"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
