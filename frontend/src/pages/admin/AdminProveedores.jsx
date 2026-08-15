import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { PUEDE_VER_PROVEEDORES } from "../../roles.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { soloTexto, soloNumeros, soloRuc } from "../../validacion.js";

const VACIO = { nombre: "", contacto_nombre: "", telefono: "", email: "", direccion: "", ruc: "", notas: "" };

export default function AdminProveedores() {
  const { usuario } = useAuth();
  const puedeGestionar = ["superadmin", "editor"].includes(usuario?.rol);

  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.adminProveedores().then(setProveedores);

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefono = (e) => setForm({ ...form, telefono: soloNumeros(e.target.value) });
  const actualizarRuc = (e) => setForm({ ...form, ruc: soloRuc(e.target.value) });

  const nuevo = () => {
    setEditandoId(null);
    setForm(VACIO);
    setMostrarForm(true);
  };

  const editar = (p) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      contacto_nombre: p.contacto_nombre || "",
      telefono: p.telefono || "",
      email: p.email || "",
      direccion: p.direccion || "",
      ruc: p.ruc || "",
      notas: p.notas || "",
    });
    setMostrarForm(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (editandoId) {
        await api.adminActualizarProveedor(editandoId, form);
      } else {
        await api.adminCrearProveedor(form);
      }
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!confirm(`¿Desactivar al proveedor "${p.nombre}"?`)) return;
    await api.adminEliminarProveedor(p.id);
    cargar();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-plum">Proveedores</h1>
        {puedeGestionar && (
          <button
            onClick={nuevo}
            className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
          >
            + Nuevo proveedor
          </button>
        )}
      </div>

      <div className="glass overflow-hidden rounded-3xl shadow-glass">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              {puedeGestionar && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <tr key={p.id} className="border-t border-white/40">
                <td className="px-4 py-3 font-medium text-plum">{p.nombre}</td>
                <td className="px-4 py-3 text-plum-soft">{p.contacto_nombre || "—"}</td>
                <td className="px-4 py-3 text-plum-soft">{p.telefono || "—"}</td>
                <td className="px-4 py-3 text-plum-soft">{p.email || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.activo ? "bg-berry/10 text-berry-dark" : "bg-plum/10 text-plum-soft"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => editar(p)} className="mr-2 text-berry hover:underline">
                      Editar
                    </button>
                    <button onClick={() => eliminar(p)} className="text-plum-soft hover:text-berry">
                      Desactivar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {proveedores.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No hay proveedores todavía.</p>
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
            onSubmit={guardar}
            className="glass-strong relative w-full max-w-md rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 className="mb-4 font-display text-xl font-semibold text-plum">
              {editandoId ? "Editar proveedor" : "Nuevo proveedor"}
            </h2>

            <div className="space-y-3">
              <input
                placeholder="Nombre / razón social"
                required
                maxLength={150}
                value={form.nombre}
                onChange={actualizarCampo("nombre")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Persona de contacto"
                maxLength={120}
                value={form.contacto_nombre}
                onChange={actualizarTexto("contacto_nombre")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Teléfono"
                  inputMode="numeric"
                  maxLength={9}
                  value={form.telefono}
                  onChange={actualizarTelefono}
                  className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
                <input
                  placeholder="RUC (opcional)"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.ruc}
                  onChange={actualizarRuc}
                  className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                maxLength={120}
                value={form.email}
                onChange={actualizarCampo("email")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Dirección"
                maxLength={200}
                value={form.direccion}
                onChange={actualizarCampo("direccion")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <textarea
                placeholder="Notas (qué le compras, condiciones, etc.)"
                rows={2}
                maxLength={500}
                value={form.notas}
                onChange={actualizarCampo("notas")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>

            {error && <p className="mt-3 text-sm text-berry-dark">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear proveedor"}
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
