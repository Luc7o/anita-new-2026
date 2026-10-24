import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/Spinner.jsx";
import { SkeletonFilasAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { soloTexto } from "../../validacion.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import Paginador from "../../components/Paginador.jsx";
import { usePaginacion } from "../../hooks/usePaginacion.js";

const VACIO = { nombre: "", apellido: "", email: "", password: "", rol: "administrativo" };

export default function AdminUsuarios() {
  const toast = useToast();

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [roles, setRoles] = useState({});
  const [filtroRol, setFiltroRol] = useState("");
  // Paginación: debe ir DESPUÉS de declarar `usuarios` y `filtroRol`, porque los usa.
  const pag = usePaginacion(usuarios, 10);
  useEffect(() => { pag.setPagina(1); }, [filtroRol]);
  const [form, setForm] = useState(VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [avisoRol, setAvisoRol] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarUsuarios = (rol = "") =>
    api.adminUsuarios(rol ? { rol } : {}).then(setUsuarios);

  useEffect(() => {
    api.adminRolesDisponibles().then(setRoles);
    cargarUsuarios().finally(() => setCargandoLista(false));
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api.adminCrearUsuarioStaff(form);
      toast.success("Usuario creado");
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
      toast.success("Rol actualizado");
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
          className="rounded-[10px] bg-berry px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark"
        >
          + Nuevo miembro del staff
        </button>
      </div>

      {avisoRol && (
        <div
          role="alert"
          className="glass mb-4 flex items-center justify-between gap-3 rounded-2xl border border-berry/30 px-4 py-3 text-sm text-berry-dark"
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
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
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
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              filtroRol === valor ? "bg-berry text-white" : "glass text-plum"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Paginador pagina={pag.pagina} porPagina={pag.porPagina} total={pag.total} onCambiar={pag.setPagina} className="mb-2" />
      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pag.items.map((u) => (
              <tr key={u.id} className="border-t border-white/40">
                <td className="px-4 py-3 font-medium text-plum">{u.nombre_completo}</td>
                <td className="px-4 py-3 text-plum-soft">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value)}
                    aria-label={`Rol de ${u.nombre_completo}`}
                    className="rounded-md bg-white px-3 py-1 text-xs text-plum focus:outline-none"
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
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
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
        {cargandoLista && <SkeletonFilasAdmin etiqueta="Cargando lista" />}
        {!cargandoLista && usuarios.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No hay usuarios con ese filtro.</p>
        )}
      </div>

      {/* Tarjetas — solo móvil/tablet */}
      <div className="space-y-3 md:hidden">
        {pag.items.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-plum">{u.nombre_completo}</p>
                <p className="truncate text-xs text-plum-soft">{u.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
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
                className="rounded-[10px] bg-white px-3 py-1.5 text-xs text-plum focus:outline-none"
              >
                {Object.entries(roles).map(([valor, label]) => (
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
        {cargandoLista && <SkeletonFilasAdmin etiqueta="Cargando lista" />}
        {!cargandoLista && usuarios.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-plum-soft">
            No hay usuarios con ese filtro.
          </p>
        )}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 animate-fade-in bg-plum/30 backdrop-blur-sm"
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
            className="animate-scale-in glass-strong relative w-full max-w-md rounded-2xl p-6 shadow-glass-lg sm:p-8"
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
                    className="w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none"
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
                    className="w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none"
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
                  className="w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none"
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
                  className="w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none"
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
                  className="w-full rounded-2xl bg-white px-4 py-2.5 text-plum focus:outline-none"
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
                className="flex-1 rounded-[10px] bg-berry py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardando ? <><Spinner />Creando...</> : "Crear usuario"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-plum"
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