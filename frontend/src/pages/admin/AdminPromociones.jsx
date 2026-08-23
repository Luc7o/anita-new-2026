import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const VACIO = {
  etiqueta: "",
  titulo: "",
  descripcion: "",
  imagen_url: "",
  boton_texto: "Ver Todo",
  boton_link: "/tienda",
  fecha_inicio: "",
  fecha_fin: "",
  activo: true,
  orden: 0,
};

export default function AdminPromociones() {
  const [promociones, setPromociones] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const cargar = () => api.adminPromociones().then(setPromociones);

  useEffect(() => {
    cargar();
  }, []);

  const actualizarCampo = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [campo]: valor });
  };

  const editar = (promo) => {
    setEditandoId(promo.id);
    setForm({
      etiqueta: promo.etiqueta || "",
      titulo: promo.titulo,
      descripcion: promo.descripcion || "",
      imagen_url: promo.imagen_url || "",
      boton_texto: promo.boton_texto || "Ver Todo",
      boton_link: promo.boton_link || "/tienda",
      fecha_inicio: promo.fecha_inicio || "",
      fecha_fin: promo.fecha_fin || "",
      activo: promo.activo,
      orden: promo.orden || 0,
    });
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm(VACIO);
  };

  const subirImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoImagen(true);
    setError("");
    try {
      const { url } = await api.adminSubirImagenPromocion(archivo);
      setForm((f) => ({ ...f, imagen_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoImagen(false);
      e.target.value = "";
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      const payload = { ...form, orden: parseInt(form.orden, 10) || 0 };
      if (editandoId) {
        await api.adminActualizarPromocion(editandoId, payload);
      } else {
        await api.adminCrearPromocion(payload);
      }
      cancelar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (promo) => {
    if (!confirm(`¿Eliminar la promoción "${promo.titulo}"?`)) return;
    await api.adminEliminarPromocion(promo.id);
    cargar();
  };

  const alternarActivo = async (promo) => {
    await api.adminActualizarPromocion(promo.id, { activo: !promo.activo });
    cargar();
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold text-plum">Promociones de Temporada</h1>
      <p className="mb-6 text-sm text-plum-soft">
        Los banners que se muestran en el carrusel del inicio. Puedes crear una para el Día de la Madre,
        el Día del Niño, Navidad, etc. y activarla solo mientras dure la campaña.
      </p>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={guardar} className="glass h-fit space-y-3 rounded-3xl p-6 shadow-glass">
          <h2 className="font-display text-lg font-semibold text-plum">
            {editandoId ? "Editar promoción" : "Nueva promoción"}
          </h2>

          <div>
            <label className="mb-1 block text-xs font-semibold text-plum-soft">Imagen de fondo</label>
            {form.imagen_url && (
              <img
                src={form.imagen_url}
                alt="Vista previa"
                className="mb-2 h-32 w-full rounded-2xl object-cover shadow-glass"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={subirImagen}
              disabled={subiendoImagen}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-sm text-plum shadow-glass file:mr-3 file:rounded-full file:border-0 file:bg-berry file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            {subiendoImagen && <p className="mt-1 text-xs text-plum-soft">Subiendo...</p>}
          </div>

          <input
            placeholder="Etiqueta (ej. Día de la Madre, Temporada 2026)"
            maxLength={60}
            value={form.etiqueta}
            onChange={actualizarCampo("etiqueta")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <input
            placeholder="Título"
            required
            maxLength={150}
            value={form.titulo}
            onChange={actualizarCampo("titulo")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
          <textarea
            placeholder="Descripción (opcional)"
            maxLength={400}
            rows={2}
            value={form.descripcion}
            onChange={actualizarCampo("descripcion")}
            className="w-full resize-none rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Texto del botón"
              maxLength={60}
              value={form.boton_texto}
              onChange={actualizarCampo("boton_texto")}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
            <input
              placeholder="Enlace del botón (ej. /tienda)"
              maxLength={200}
              value={form.boton_link}
              onChange={actualizarCampo("boton_link")}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-plum-soft">Desde (opcional)</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={actualizarCampo("fecha_inicio")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-plum-soft">Hasta (opcional)</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={actualizarCampo("fecha_fin")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Orden"
              value={form.orden}
              onChange={actualizarCampo("orden")}
              className="w-24 rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-plum">
              <input type="checkbox" checked={form.activo} onChange={actualizarCampo("activo")} />
              Activa
            </label>
          </div>

          {error && <p className="text-sm text-berry-dark">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
            >
              {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear promoción"}
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
          {promociones.length === 0 && (
            <p className="text-sm text-plum-soft">Aún no creaste ninguna promoción de temporada.</p>
          )}
          {promociones.map((promo) => (
            <div key={promo.id} className="glass rounded-2xl p-4 shadow-glass">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {promo.etiqueta && (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-berry-dark">
                      {promo.etiqueta}
                    </p>
                  )}
                  <p className="truncate font-display font-medium text-plum">{promo.titulo}</p>
                  <p className="text-xs text-plum-soft">
                    {promo.fecha_inicio || promo.fecha_fin
                      ? `${promo.fecha_inicio || "sin inicio"} — ${promo.fecha_fin || "sin fin"}`
                      : "Sin límite de fechas"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    promo.vigente
                      ? "bg-berry/10 text-berry-dark"
                      : "bg-plum/10 text-plum-soft"
                  }`}
                >
                  {promo.vigente ? "Vigente" : promo.activo ? "Fuera de fecha" : "Inactiva"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => editar(promo)}
                  className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-plum shadow-glass hover:bg-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => alternarActivo(promo)}
                  className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold text-plum shadow-glass hover:bg-white"
                >
                  {promo.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => eliminar(promo)}
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
