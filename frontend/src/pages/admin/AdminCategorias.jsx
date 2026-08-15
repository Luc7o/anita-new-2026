import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const VACIO = { nombre: "", descripcion: "", icono: "bag" };

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.adminCategorias().then(setCategorias);

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const editar = (cat) => {
    setEditandoId(cat.id);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || "", icono: cat.icono || "bag" });
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm(VACIO);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (editandoId) {
        await api.adminActualizarCategoria(editandoId, form);
      } else {
        await api.adminCrearCategoria(form);
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (cat) => {
    if (!confirm(`¿Eliminar/desactivar "${cat.nombre}"?`)) return;
    await api.adminEliminarCategoria(cat.id);
    cargar();
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-plum">Categorías</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
        <form onSubmit={guardar} className="glass h-fit space-y-3 rounded-3xl p-6 shadow-glass">
          <h2 className="font-display text-lg font-semibold text-plum">
            {editandoId ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <input
            placeholder="Nombre"
            required
            maxLength={80}
            value={form.nombre}
            onChange={actualizarCampo("nombre")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Descripción (opcional)"
            maxLength={300}
            value={form.descripcion}
            onChange={actualizarCampo("descripcion")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          {error && <p className="text-sm text-berry-dark">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
            >
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear categoría"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className="rounded-full bg-white/70 px-4 py-2.5 text-sm font-semibold text-plum shadow-glass"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {categorias.map((cat) => (
            <div key={cat.id} className="glass flex items-center justify-between rounded-2xl p-4 shadow-glass">
              <div>
                <p className="font-display font-medium text-plum">{cat.nombre}</p>
                <p className="text-xs text-plum-soft">/{cat.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editar(cat)}
                  className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-plum shadow-glass hover:bg-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(cat)}
                  className="rounded-full bg-berry/10 px-4 py-1.5 text-xs font-semibold text-berry-dark shadow-glass hover:bg-berry/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
