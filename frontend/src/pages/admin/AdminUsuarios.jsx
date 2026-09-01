import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { soloTexto } from "../../validacion.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import { useAuth } from "../../context/AuthContext.jsx";

const VACIO = { nombre: "", apellido: "", email: "", password: "", rol: "editor" };

export default function AdminUsuarios() {
  const { usuario: usuarioActual } = useAuth();
  const esRRHH = usuarioActual?.rol === "rrhh";

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState({});
  const [filtroRol, setFiltroRol] = useState("");
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [avisoRol, setAvisoRol] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = (rol = "") =>
    api.adminUsuarios(rol ? { rol } : {}).then(setUsuarios);

  useEffect(() => {
    api.adminRolesDisponibles().then(setRoles);
    cargarUsuarios();
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });

  // RRHH no ve "superadmin" como opción asignable, en ningún selector.
  const rolesAsignables = esRRHH
    ? Object.entries(roles).filter(([valor]) => valor !== "superadmin")
    : Object.entries(roles);

  const esSuperAdmin = (u) => u.rol === "superadmin";

  // RRHH no puede cambiar su propio rol, ni el de nadie que ya sea Super administrador.
  const puedeEditarRolDe = (u) =>
    !(esRRHH && (u.id === usuarioActual.id || esSuperAdmin(u)));

  const motivoBloqueo = (u) => {
    if (puedeEditarRolDe(u)) return undefined;
    if (u.id === usuarioActual.id) return "No puedes cambiar tu propio rol";
    return "No puedes cambiar el rol de un Super administrador";
  };

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
    setAvisoRol("");
    try {
      await api.adminCambiarRol(usuario.id, nuevoRol);
      cargarUsuarios(filtroRol);
    } catch (err) {
      setAvisoRol(err.message || "No se pudo cambiar el rol.");
    }
  };

  const cambiarEstado = async (usuario) => {
    await api.adminCambiarEstadoUsuario(usuario.id, !usuario.activo);
    cargarUsuarios(filtroRol);
  };

  const refDialogo = useFocusTrap(mostrarForm, () => setMostrarForm(false));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-plum">Usuarios y roles</h1>
        <button
          onClick={() => setMostrarForm(true)}
          className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
        >
          + Nuevo miembro del staff
        </button>
      </div>

      {avisoRol && (
        <div
          role="alert"
          className="glass mb-4 flex items-center justify-between gap-3 rounded-2xl border border-berry/30 px-4 py-3 text-sm text-berry-dark shadow-glass"
        >
          <span>{avisoRol}</span>
          <button
            onClick={() => setAvisoRol("")}
            className="shrink-0 text-plum-soft hover:text-berry"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

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

      <div className="glass hidden overflow-hidden rounded-3xl shadow-glass md:block">
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
                    disabled={!puedeEditarRolDe(u)}
                    aria-label={`Rol de ${u.nombre_completo}`}
                    title={motivoBloqueo(u)}
                    className="rounded-full bg-white/70 px-3 py-1 text-xs text-plum shadow-glass focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {(puedeEditarRolDe(u) ? rolesAsignables : Object.entries(roles)).map(([valor, label]) => (
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

      {/* Tarjetas — solo móvil/tablet */}
      <div className="space-y-3 md:hidden">
        {usuarios.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-4 shadow-glass">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-plum">{u.nombre_completo}</p>
                <p className="truncate text-xs text-plum-soft">{u.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  u.activo !== false ? "bg-berry/10 text-berry-dark" : "bg-plum/10 text-plum-soft"
                }`}
              >
                {u.activo !== false ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <label className="sr-only" htmlFor={`rol-movil-${u.id}`}>Rol de {u.nombre_completo}</label>
              <select
                id={`rol-movil-${u.id}`}
                value={u.rol}
                onChange={(e) => cambiarRol(u, e.target.value)}
                disabled={!puedeEditarRolDe(u)}
                title={motivoBloqueo(u)}
                className="rounded-full bg-white/70 px-3 py-1.5 text-xs text-plum shadow-glass focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(puedeEditarRolDe(u) ? rolesAsignables : Object.entries(roles)).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
              <button onClick={() => cambiarEstado(u)} className="text-sm text-plum-soft hover:text-berry">
                {u.activo !== false ? "Desactivar" : "Reactivar"}
              </button>
            </div>
          </div>
        ))}
        {usuarios.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-plum-soft shadow-glass">
            No hay usuarios con ese filtro.
          </p>
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
            ref={refDialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nuevo-staff-titulo"
            tabIndex={-1}
            onSubmit={crear}
            className="glass-strong relative w-full max-w-md rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 id="nuevo-staff-titulo" className="mb-4 text-xl font-semibold text-plum">
              Nuevo miembro del staff
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="staff-nombre" className="mb-1 block text-xs font-medium text-plum-soft">
                    Nombre
                  </label>
                  <input
                    id="staff-nombre"
                    required
                    maxLength={80}
                    value={form.nombre}
                    onChange={actualizarTexto("nombre")}
                    className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="staff-apellido" className="mb-1 block text-xs font-medium text-plum-soft">
                    Apellido
                  </label>
                  <input
                    id="staff-apellido"
                    required
                    maxLength={80}
                    value={form.apellido}
                    onChange={actualizarTexto("apellido")}
                    className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="staff-email" className="mb-1 block text-xs font-medium text-plum-soft">
                  Email
                </label>
                <input
                  id="staff-email"
                  type="email"
                  required
                  maxLength={120}
                  value={form.email}
                  onChange={actualizarCampo("email")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="staff-password" className="mb-1 block text-xs font-medium text-plum-soft">
                  Contraseña temporal
                </label>
                <input
                  id="staff-password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={72}
                  value={form.password}
                  onChange={actualizarCampo("password")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="staff-rol" className="mb-1 block text-xs font-medium text-plum-soft">
                  Rol
                </label>
                <select
                  id="staff-rol"
                  value={form.rol}
                  onChange={actualizarCampo("rol")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                >
                  {rolesAsignables
                    .filter(([valor]) => valor !== "cliente")
                    .map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-berry-dark" role="alert">
                {error}
              </p>
            )}

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