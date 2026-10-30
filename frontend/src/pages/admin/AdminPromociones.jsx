import { useConfirm } from "../../components/ConfirmDialog.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/Spinner.jsx";
import { SkeletonFilasAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { hoyISO } from "../../formato.js";
import ImagenOptimizada from "../../components/ImagenOptimizada.jsx";
import { IconClose, IconSearch, IconChevronDown } from "../../components/Icons.jsx";
import { TIENDA_URL } from "../../lib/appMode.js";

const VACIO = {
  etiqueta: "",
  titulo: "",
  descripcion: "",
  imagen_url: "",
  boton_texto: "Ver Todo",
  fecha_inicio: "",
  fecha_fin: "",
  activo: true,
};

const TIPOS_ENLACE = [
  { id: "tienda", label: "Toda la tienda" },
  { id: "ofertas", label: "Solo las ofertas" },
  { id: "categoria", label: "Una categoría" },
  { id: "producto", label: "Un producto" },
  { id: "otro", label: "Otro enlace" },
];

const campo =
  "mt-1 block w-full rounded-xl bg-white px-4 py-2.5 text-sm text-plum ring-1 ring-plum/15 placeholder:text-plum-soft/70 focus:outline-none focus:ring-2 focus:ring-berry/40";
const etiquetaCampo = "block text-xs font-semibold text-plum-soft";

// A dónde lleva el botón de una promoción ya guardada (para editarla).
function tipoDeEnlace(link, productoId) {
  if (productoId || /^\/producto\/\d+/.test(link || "")) return "producto";
  if (!link || link === "/tienda") return "tienda";
  if (link === "/tienda?oferta=true") return "ofertas";
  if (link.startsWith("/tienda?categoria=")) return "categoria";
  return "otro";
}

// Cómo se verá en el carrusel del inicio (misma estructura que el Hero de la tienda).
function VistaPrevia({ form }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-chrome via-berry-dark to-berry p-5 text-white">
      <div className="grid grid-cols-[1.2fr_0.8fr] items-center gap-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-berry-light">
            {form.etiqueta || "Anita New Style"}
          </p>
          <p className="mt-1 break-words font-sans text-lg font-extrabold uppercase leading-tight">
            {form.titulo || "Título de la promoción"}
          </p>
          {form.descripcion && <p className="mt-1 line-clamp-3 text-xs text-white/75">{form.descripcion}</p>}
          <span className="mt-3 inline-block rounded-[10px] bg-white/90 px-3 py-1.5 text-xs font-semibold text-plum">
            {form.boton_texto || "Ver Todo"}
          </span>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-xl bg-chrome ring-1 ring-white/15">
          {form.imagen_url ? (
            <ImagenOptimizada src={form.imagen_url} variante="med" alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-white/60">
              Sin imagen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPromociones() {
  const toast = useToast();
  const confirmar = useConfirm();
  const [promociones, setPromociones] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [reordenando, setReordenando] = useState(false);

  // A dónde lleva el botón
  const [tipoEnlace, setTipoEnlace] = useState("tienda");
  const [categorias, setCategorias] = useState([]);
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [enlaceLibre, setEnlaceLibre] = useState("");
  const [productoElegido, setProductoElegido] = useState(null); // { id, nombre }
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [resultadosProducto, setResultadosProducto] = useState([]);
  const pedidoProducto = useRef(0);

  const cargar = () => api.adminPromociones().then(setPromociones);

  useEffect(() => {
    cargar().finally(() => setCargandoLista(false));
    // Las categorías son solo una comodidad para armar el enlace: si este rol no puede verlas, se sigue sin ellas.
    api.adminCategorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  // Búsqueda de producto (por nombre o SKU) para vincularlo a la promoción
  useEffect(() => {
    const q = busquedaProducto.trim();
    if (tipoEnlace !== "producto" || !q) {
      setResultadosProducto([]);
      return undefined;
    }
    const t = setTimeout(() => {
      const id = ++pedidoProducto.current;
      api
        .adminProductos({ q, activo: "true", por_pagina: 6 })
        .then((d) => { if (id === pedidoProducto.current) setResultadosProducto(d.productos); })
        .catch(() => { if (id === pedidoProducto.current) setResultadosProducto([]); });
    }, 250);
    return () => clearTimeout(t);
  }, [busquedaProducto, tipoEnlace]);

  const actualizarCampo = (nombre) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [nombre]: valor });
  };

  const reiniciarEnlace = () => {
    setTipoEnlace("tienda");
    setCategoriaSlug("");
    setEnlaceLibre("");
    setProductoElegido(null);
    setBusquedaProducto("");
    setResultadosProducto([]);
  };

  const editar = (promo) => {
    setEditandoId(promo.id);
    setError("");
    setForm({
      etiqueta: promo.etiqueta || "",
      titulo: promo.titulo,
      descripcion: promo.descripcion || "",
      imagen_url: promo.imagen_url || "",
      boton_texto: promo.boton_texto || "Ver Todo",
      fecha_inicio: promo.fecha_inicio || "",
      fecha_fin: promo.fecha_fin || "",
      activo: promo.activo,
    });
    const tipo = tipoDeEnlace(promo.boton_link, promo.producto_id);
    setTipoEnlace(tipo);
    setCategoriaSlug(tipo === "categoria" ? promo.boton_link.replace("/tienda?categoria=", "") : "");
    setEnlaceLibre(tipo === "otro" ? promo.boton_link : "");
    setProductoElegido(
      tipo === "producto"
        ? { id: promo.producto_id || Number(promo.boton_link.split("/")[2]), nombre: promo.producto?.nombre || "Producto vinculado" }
        : null
    );
    setBusquedaProducto("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm(VACIO);
    setError("");
    reiniciarEnlace();
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

  // Enlace final del botón según lo elegido (o un mensaje de error si falta algo).
  const armarEnlace = () => {
    switch (tipoEnlace) {
      case "ofertas":
        return { link: "/tienda?oferta=true", productoId: null };
      case "categoria":
        if (!categoriaSlug) return { error: "Elige la categoría a la que llevará el botón." };
        return { link: `/tienda?categoria=${categoriaSlug}`, productoId: null };
      case "producto":
        if (!productoElegido) return { error: "Busca y elige el producto al que llevará el botón." };
        return { link: `/producto/${productoElegido.id}`, productoId: productoElegido.id };
      case "otro": {
        const l = enlaceLibre.trim();
        if (!/^(\/|https?:\/\/)/.test(l)) {
          return { error: "El enlace debe empezar con / (página de la tienda) o con https:// (sitio externo)." };
        }
        return { link: l, productoId: null };
      }
      default:
        return { link: "/tienda", productoId: null };
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) return setError("El título es obligatorio.");
    if (!form.imagen_url) return setError("Sube una imagen: sin ella la promoción no aparece en el carrusel del inicio.");
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      return setError("La fecha \"Hasta\" no puede ser anterior a \"Desde\".");
    }
    const enlace = armarEnlace();
    if (enlace.error) return setError(enlace.error);

    setGuardando(true);
    try {
      const payload = {
        ...form,
        boton_texto: form.boton_texto.trim() || "Ver Todo",
        boton_link: enlace.link,
        producto_id: enlace.productoId,
      };
      if (editandoId) {
        await api.adminActualizarPromocion(editandoId, payload);
      } else {
        // Las nuevas van al final del carrusel; luego se pueden subir con las flechas.
        const mayor = promociones.reduce((m, p) => Math.max(m, p.orden || 0), 0);
        await api.adminCrearPromocion({ ...payload, orden: promociones.length ? mayor + 1 : 0 });
      }
      toast.success(editandoId ? "Promoción actualizada" : "Promoción creada");
      cancelar();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (promo) => {
    const ok = await confirmar({
      title: `¿Eliminar la promoción "${promo.titulo}"?`,
      message: "Esta acción no se puede deshacer.",
      tone: "danger",
      confirmText: "Eliminar",
    });
    if (!ok) return;
    try {
      await api.adminEliminarPromocion(promo.id);
      toast.success("Promoción eliminada");
      if (editandoId === promo.id) cancelar();
      cargar();
    } catch (err) {
      toast.error(err.message || "No se pudo eliminar la promoción");
    }
  };

  const alternarActivo = async (promo) => {
    try {
      await api.adminActualizarPromocion(promo.id, { activo: !promo.activo });
      toast.success(promo.activo ? "Promoción desactivada" : "Promoción activada");
      cargar();
    } catch (err) {
      toast.error(err.message || "No se pudo cambiar el estado");
    }
  };

  // Mueve una promoción en el carrusel (arriba = aparece antes).
  const mover = async (indice, delta) => {
    const destino = indice + delta;
    if (destino < 0 || destino >= promociones.length || reordenando) return;
    const nueva = [...promociones];
    [nueva[indice], nueva[destino]] = [nueva[destino], nueva[indice]];
    setReordenando(true);
    setPromociones(nueva); // se ve el cambio al instante
    try {
      await Promise.all(
        nueva.map((p, i) => (p.orden === i ? null : api.adminActualizarPromocion(p.id, { orden: i })))
      );
    } catch (err) {
      toast.error(err.message || "No se pudo cambiar el orden");
    } finally {
      setReordenando(false);
      cargar();
    }
  };

  const hoy = hoyISO();
  const estadoDe = (p) => {
    if (!p.activo) return { texto: "Inactiva", clase: "bg-plum/10 text-plum-soft" };
    if (p.fecha_inicio && hoy < p.fecha_inicio) return { texto: `Programada desde ${p.fecha_inicio}`, clase: "bg-gold/30 text-plum" };
    if (p.fecha_fin && hoy > p.fecha_fin) return { texto: "Vencida", clase: "bg-plum/10 text-plum-soft" };
    if (!p.imagen_url) return { texto: "Sin imagen: no se muestra", clase: "bg-red-100 text-red-700" };
    return { texto: "En el inicio", clase: "bg-green-100 text-green-700" };
  };
  const enInicio = promociones.filter((p) => p.vigente && p.imagen_url);
  const urlInicio = TIENDA_URL || "/";

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold text-plum">Promociones de Temporada</h1>
        <p className="text-sm text-plum-soft">
          Los banners que se muestran en el carrusel del inicio. Crea una para el Día de la Madre, el Día del Niño,
          Navidad, etc. y actívala solo mientras dure la campaña.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={guardar} className="glass h-fit space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-plum">{editandoId ? "Editar promoción" : "Nueva promoción"}</h2>

          <VistaPrevia form={form} />

          <div>
            <span className={etiquetaCampo}>Imagen del banner (obligatoria)</span>
            <label className="mt-1 flex cursor-pointer flex-wrap items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-plum/15">
              <span className="rounded-[10px] bg-berry px-3 py-1.5 text-xs font-semibold text-white">
                {subiendoImagen ? "Subiendo..." : form.imagen_url ? "Cambiar imagen" : "Seleccionar archivo"}
              </span>
              <span className="text-xs text-plum-soft">
                {form.imagen_url ? "Imagen cargada" : "Ningún archivo seleccionado"} · vertical (4:5) se ve mejor
              </span>
              <input type="file" accept="image/*" onChange={subirImagen} disabled={subiendoImagen} className="sr-only" />
            </label>
          </div>

          <div>
            <label htmlFor="promo-etiqueta" className={etiquetaCampo}>Etiqueta (texto chico sobre el título)</label>
            <input id="promo-etiqueta" placeholder="Ej. Día de la Madre, Temporada 2026" maxLength={60} value={form.etiqueta} onChange={actualizarCampo("etiqueta")} className={campo} />
          </div>
          <div>
            <label htmlFor="promo-titulo" className={etiquetaCampo}>Título *</label>
            <input id="promo-titulo" placeholder="Ej. Hasta 30% de descuento" required maxLength={150} value={form.titulo} onChange={actualizarCampo("titulo")} className={campo} />
          </div>
          <div>
            <label htmlFor="promo-desc" className={etiquetaCampo}>Descripción (opcional)</label>
            <textarea id="promo-desc" rows={2} maxLength={400} placeholder="Una línea corta que acompañe al título" value={form.descripcion} onChange={actualizarCampo("descripcion")} className={`${campo} resize-none`} />
          </div>

          <div className="rounded-xl bg-white/60 p-4">
            <p className="text-sm font-semibold text-plum">Botón de la promoción</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="promo-boton-texto" className={etiquetaCampo}>Texto del botón</label>
                <input id="promo-boton-texto" maxLength={60} value={form.boton_texto} onChange={actualizarCampo("boton_texto")} className={campo} />
              </div>
              <div>
                <label htmlFor="promo-tipo" className={etiquetaCampo}>¿A dónde lleva?</label>
                <div className="relative">
                  <select
                    id="promo-tipo"
                    value={tipoEnlace}
                    onChange={(e) => { setTipoEnlace(e.target.value); setError(""); }}
                    className={`${campo} appearance-none pr-9`}
                  >
                    {TIPOS_ENLACE.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  <IconChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-plum-soft" />
                </div>
              </div>
            </div>

            {tipoEnlace === "categoria" && (
              <div className="mt-3">
                <label htmlFor="promo-cat" className={etiquetaCampo}>Categoría</label>
                <select id="promo-cat" value={categoriaSlug} onChange={(e) => setCategoriaSlug(e.target.value)} className={campo}>
                  <option value="">Elige una categoría…</option>
                  {categorias.filter((c) => c.activo !== false).map((c) => (
                    <option key={c.id} value={c.slug}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {tipoEnlace === "producto" && (
              <div className="mt-3">
                {productoElegido ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm text-plum ring-1 ring-plum/15">
                    <span className="truncate">{productoElegido.nombre}</span>
                    <button type="button" onClick={() => setProductoElegido(null)} aria-label="Quitar producto" className="text-plum-soft hover:text-berry">
                      <IconClose size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="promo-prod" className={etiquetaCampo}>Buscar producto (nombre o SKU)</label>
                    <div className="relative">
                      <input id="promo-prod" autoComplete="off" value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} placeholder="Escribe para buscar…" className={`${campo} pr-9`} />
                      <IconSearch size={15} className="pointer-events-none absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-plum-soft" />
                    </div>
                    {resultadosProducto.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-xl bg-white p-1.5 ring-1 ring-plum/15">
                        {resultadosProducto.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setProductoElegido({ id: p.id, nombre: p.nombre }); setBusquedaProducto(""); setResultadosProducto([]); }}
                            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-plum hover:bg-berry/5"
                          >
                            <span className="truncate">{p.nombre}</span>
                            <span className="shrink-0 font-mono text-xs text-plum-soft">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tipoEnlace === "otro" && (
              <div className="mt-3">
                <label htmlFor="promo-otro" className={etiquetaCampo}>Enlace</label>
                <input id="promo-otro" maxLength={200} placeholder="/tienda?categoria=vestidos  o  https://…" value={enlaceLibre} onChange={(e) => setEnlaceLibre(e.target.value)} className={campo} />
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="promo-desde" className={etiquetaCampo}>Desde (opcional)</label>
              <input id="promo-desde" type="date" value={form.fecha_inicio} max={form.fecha_fin || undefined} onChange={actualizarCampo("fecha_inicio")} className={campo} />
            </div>
            <div>
              <label htmlFor="promo-hasta" className={etiquetaCampo}>Hasta (opcional)</label>
              <input id="promo-hasta" type="date" value={form.fecha_fin} min={form.fecha_inicio || undefined} onChange={actualizarCampo("fecha_fin")} className={campo} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-plum-soft">Sin fechas, la promoción se muestra mientras esté activa. El último día incluido es "Hasta".</p>

          <label className="flex items-center gap-2 text-sm text-plum">
            <input type="checkbox" checked={form.activo} onChange={actualizarCampo("activo")} />
            Activa (visible en el inicio)
          </label>

          {error && <p role="alert" className="text-sm text-berry-dark">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={guardando || subiendoImagen} className="flex-1 rounded-[10px] bg-berry py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60">
              {guardando ? <><Spinner />Guardando...</> : editandoId ? "Guardar cambios" : "Crear promoción"}
            </button>
            {editandoId && (
              <button type="button" onClick={cancelar} className="rounded-[10px] bg-white px-4 py-2.5 text-sm font-semibold text-plum ring-1 ring-plum/15">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <div className="glass rounded-2xl p-4 text-sm text-plum">
            {enInicio.length === 0 ? (
              <p>Ahora mismo el inicio muestra el banner por defecto, porque no hay promociones vigentes con imagen.</p>
            ) : (
              <p>
                El inicio muestra <strong>{enInicio.length}</strong> promoción{enInicio.length === 1 ? "" : "es"} en el carrusel, en el orden de esta lista.
              </p>
            )}
            <a href={urlInicio} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-berry hover:underline">
              Ver el inicio de la tienda →
            </a>
          </div>

          {cargandoLista && <SkeletonFilasAdmin etiqueta="Cargando lista" />}
          {!cargandoLista && promociones.length === 0 && (
            <p className="text-sm text-plum-soft">Aún no creaste ninguna promoción de temporada.</p>
          )}

          {promociones.map((promo, i) => {
            const estado = estadoDe(promo);
            return (
              <div key={promo.id} className={`glass rounded-2xl p-4 ${editandoId === promo.id ? "ring-2 ring-berry/40" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-plum/10">
                    {promo.imagen_url && (
                      <ImagenOptimizada src={promo.imagen_url} variante="thumb" alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {promo.etiqueta && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-berry-dark">{promo.etiqueta}</p>
                    )}
                    <p className="truncate font-medium text-plum">{promo.titulo}</p>
                    <p className="text-xs text-plum-soft">
                      {promo.fecha_inicio || promo.fecha_fin
                        ? `${promo.fecha_inicio || "sin inicio"} — ${promo.fecha_fin || "sin fin"}`
                        : "Sin límite de fechas"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-plum-soft">
                      Botón «{promo.boton_texto}» → {promo.producto ? promo.producto.nombre : promo.boton_link}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" onClick={() => mover(i, -1)} disabled={i === 0 || reordenando} aria-label="Subir en el carrusel" title="Mostrar antes" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-plum ring-1 ring-plum/15 hover:bg-berry/5 disabled:opacity-40">
                      <IconChevronDown size={14} className="rotate-180" />
                    </button>
                    <button type="button" onClick={() => mover(i, 1)} disabled={i === promociones.length - 1 || reordenando} aria-label="Bajar en el carrusel" title="Mostrar después" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-plum ring-1 ring-plum/15 hover:bg-berry/5 disabled:opacity-40">
                      <IconChevronDown size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => editar(promo)} className="rounded-[10px] bg-white px-4 py-1.5 text-xs font-semibold text-plum ring-1 ring-plum/15 hover:bg-berry/5">
                    Editar
                  </button>
                  <button onClick={() => alternarActivo(promo)} className="rounded-[10px] bg-white px-4 py-1.5 text-xs font-semibold text-plum ring-1 ring-plum/15 hover:bg-berry/5">
                    {promo.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => eliminar(promo)} className="rounded-[10px] bg-berry/10 px-4 py-1.5 text-xs font-semibold text-berry-dark hover:bg-berry/20">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
