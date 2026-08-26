import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { IconSearch, IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconTag } from "../../components/Icons.jsx";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

const VACIO = { nombre: "", descripcion: "", icono: "bag" };
const POR_PAGINA = 7;

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [orden, setOrden] = useState("productos_desc");
  const [pagina, setPagina] = useState(1);

  const refDialogo = useFocusTrap(mostrarForm, () => setMostrarForm(false));

  const cargar = () => api.adminCategorias().then(setCategorias);

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const nuevaCategoria = () => {
    setEditandoId(null);
    setForm(VACIO);
    setError("");
    setMostrarForm(true);
  };

  const editar = (cat) => {
    setEditandoId(cat.id);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || "", icono: cat.icono || "bag" });
    setError("");
    setMostrarForm(true);
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
      setMostrarForm(false);
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

  const cambiarEstado = async (cat) => {
    await api.adminActualizarCategoria(cat.id, { activo: !cat.activo });
    cargar();
  };

  const listado = useMemo(() => {
    let lista = [...categorias];

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter(
        (c) => c.nombre.toLowerCase().includes(q) || (c.descripcion || "").toLowerCase().includes(q)
      );
    }

    if (filtroEstado === "activo") lista = lista.filter((c) => c.activo);
    if (filtroEstado === "inactivo") lista = lista.filter((c) => !c.activo);

    switch (orden) {
      case "nombre":
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "productos_asc":
        lista.sort((a, b) => a.productos_count - b.productos_count);
        break;
      case "productos_desc":
      default:
        lista.sort((a, b) => b.productos_count - a.productos_count);
        break;
    }

    return lista;
  }, [categorias, busqueda, filtroEstado, orden]);

  const totalPaginas = Math.max(1, Math.ceil(listado.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = listado.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-plum">Categorías</h1>
          <p className="text-sm text-plum-soft">Administra las categorías y subcategorías de productos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass relative rounded-full shadow-glass">
            <IconSearch size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-soft" />
            <input
              placeholder="Buscar categorías..."
              value={busqueda}
              maxLength={80}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              className="w-56 rounded-full bg-transparent py-2 pl-9 pr-4 text-sm text-plum focus:outline-none"
            />
          </div>
          <button
            onClick={nuevaCategoria}
            className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
          >
            + Añadir categoría
          </button>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPagina(1);
          }}
          className="glass rounded-full px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
        >
          <option value="">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select
          value={orden}
          onChange={(e) => {
            setOrden(e.target.value);
            setPagina(1);
          }}
          className="glass rounded-full px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
        >
          <option value="productos_desc">Ordenar: Productos (mayor a menor)</option>
          <option value="productos_asc">Productos (menor a mayor)</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
      </div>

      {/* Tabla — solo desktop/tablet */}
      <div className="glass hidden overflow-hidden rounded-3xl shadow-glass md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((cat) => (
              <tr key={cat.id} className="border-t border-white/40">
                <td className="px-4 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lilac to-white text-berry">
                    <IconTag size={16} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-display font-medium text-plum">{cat.nombre}</p>
                  <p className="text-xs text-plum-soft">/{cat.slug}</p>
                </td>
                <td className="max-w-xs px-4 py-3 text-plum-soft">
                  <p className="truncate">{cat.descripcion || "—"}</p>
                </td>
                <td className="px-4 py-3 text-plum-soft">{cat.productos_count} items</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => cambiarEstado(cat)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      cat.activo ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-plum/10 text-plum-soft hover:bg-plum/20"
                    }`}
                  >
                    {cat.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => editar(cat)} aria-label={`Editar ${cat.nombre}`} className="text-plum-soft hover:text-berry">
                      <IconEdit size={16} />
                    </button>
                    <button onClick={() => eliminar(cat)} aria-label={`Eliminar ${cat.nombre}`} className="text-plum-soft hover:text-berry">
                      <IconTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginados.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/40 px-4 py-3">
            <p className="text-xs text-plum-soft">
              Mostrando {paginados.length} de {listado.length} categorías
            </p>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual <= 1}
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-plum/15 text-plum transition hover:border-berry/40 disabled:opacity-30"
                >
                  <IconChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    aria-current={n === paginaActual ? "page" : undefined}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                      n === paginaActual
                        ? "bg-berry/10 text-berry-dark"
                        : "border border-plum/15 text-plum-soft hover:border-berry/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual >= totalPaginas}
                  aria-label="Página siguiente"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-plum/15 text-plum transition hover:border-berry/40 disabled:opacity-30"
                >
                  <IconChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
        {paginados.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No se encontraron categorías.</p>
        )}
      </div>

      {/* Tarjetas — solo móvil */}
      <div className="space-y-3 md:hidden">
        {paginados.map((cat) => (
          <div key={cat.id} className="glass flex gap-3 rounded-2xl p-4 shadow-glass">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lilac to-white text-berry">
              <IconTag size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-display font-medium text-plum">{cat.nombre}</p>
                <button
                  onClick={() => cambiarEstado(cat)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    cat.activo ? "bg-green-100 text-green-700" : "bg-plum/10 text-plum-soft"
                  }`}
                >
                  {cat.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
              <p className="truncate text-xs text-plum-soft">{cat.descripcion || "Sin descripción"}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-plum-soft">{cat.productos_count} productos</span>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => editar(cat)} className="text-berry hover:underline">
                    Editar
                  </button>
                  <button onClick={() => eliminar(cat)} className="text-plum-soft hover:text-berry">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {paginados.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-plum-soft shadow-glass">
            No se encontraron categorías.
          </p>
        )}
        {paginados.length > 0 && totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaActual <= 1}
              aria-label="Página anterior"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-plum/15 text-plum disabled:opacity-30"
            >
              <IconChevronLeft size={14} />
            </button>
            <span className="px-2 text-xs text-plum-soft">
              {paginaActual} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              aria-label="Página siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-plum/15 text-plum disabled:opacity-30"
            >
              <IconChevronRight size={14} />
            </button>
          </div>
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
            aria-labelledby="categoria-form-titulo"
            tabIndex={-1}
            onSubmit={guardar}
            className="glass-strong relative w-full max-w-md rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 id="categoria-form-titulo" className="mb-4 font-display text-xl font-semibold text-plum">
              {editandoId ? "Editar categoría" : "Nueva categoría"}
            </h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="cat-nombre" className="mb-1 block text-xs font-medium text-plum-soft">
                  Nombre
                </label>
                <input
                  id="cat-nombre"
                  placeholder="Nombre"
                  required
                  maxLength={80}
                  value={form.nombre}
                  onChange={actualizarCampo("nombre")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cat-descripcion" className="mb-1 block text-xs font-medium text-plum-soft">
                  Descripción (opcional)
                </label>
                <textarea
                  id="cat-descripcion"
                  placeholder="Descripción"
                  maxLength={300}
                  rows={3}
                  value={form.descripcion}
                  onChange={actualizarCampo("descripcion")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-berry-dark" role="alert">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear categoría"}
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
