import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { IconUpload, IconClose } from "../../components/Icons.jsx";
import { soloCodigo } from "../../validacion.js";

const MINIMO_IMAGENES = 4;

const VACIO = {
  nombre: "", descripcion: "", precio: "", precio_oferta: "", stock: 0,
  sku: "", categoria_id: "", tallas: "", colores: "",
  destacado: false, es_nuevo: true, activo: true,
};

function parsearLista(texto) {
  return texto ? texto.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

// Calcula qué combinaciones de talla/color debería tener el producto (igual que el backend)
function calcularCombos(tallas, colores) {
  if (tallas.length && colores.length) {
    const combos = [];
    for (const t of tallas) for (const c of colores) combos.push({ talla: t, color: c });
    return combos;
  }
  if (tallas.length) return tallas.map((t) => ({ talla: t, color: null }));
  if (colores.length) return colores.map((c) => ({ talla: null, color: c }));
  return [];
}

function claveCombo(talla, color) {
  return `${talla || ""}||${color || ""}`;
}

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [imagenes, setImagenes] = useState([]); // [{ url, color }]
  const [stockVariantes, setStockVariantes] = useState({}); // { "talla||color": stock }
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const cargarProductos = (q = "") =>
    api.adminProductos(q ? { q } : {}).then((data) => setProductos(data.productos));

  useEffect(() => {
    cargarProductos();
    api.adminCategorias().then(setCategorias);
  }, []);

  const actualizarCampo = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [campo]: valor });
  };
  const actualizarSku = (e) => setForm({ ...form, sku: soloCodigo(e.target.value) });

  const tallasActuales = parsearLista(form.tallas);
  const coloresActuales = parsearLista(form.colores);
  const combosActuales = calcularCombos(tallasActuales, coloresActuales);
  const usaVariantes = combosActuales.length > 0;

  const actualizarStockVariante = (talla, color, valor) => {
    setStockVariantes((prev) => ({
      ...prev,
      [claveCombo(talla, color)]: Math.max(0, parseInt(valor, 10) || 0),
    }));
  };

  const coloresDisponibles = coloresActuales;

  const nuevoProducto = () => {
    setEditandoId(null);
    setForm({ ...VACIO, categoria_id: categorias[0]?.id || "" });
    setImagenes([]);
    setStockVariantes({});
    setMostrarForm(true);
  };

  const editar = async (p) => {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: p.precio,
      precio_oferta: p.precio_oferta || "",
      stock: p.stock,
      sku: p.sku || "",
      categoria_id: categorias.find((c) => c.slug === p.categoria)?.id || "",
      tallas: (p.tallas || []).join(", "),
      colores: (p.colores || []).join(", "),
      destacado: p.destacado,
      es_nuevo: p.es_nuevo,
      activo: p.activo,
    });
    // Traemos el detalle completo para tener imágenes y stock por variante
    const detalle = await api.adminProducto(p.id);
    setImagenes((detalle.imagenes || []).map((img) => ({ url: img.url, color: img.color || "" })));

    const mapaStock = {};
    (detalle.variantes || []).forEach((v) => {
      mapaStock[claveCombo(v.talla, v.color)] = v.stock;
    });
    setStockVariantes(mapaStock);
    setMostrarForm(true);
  };

  const subirImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
    setError("");
    try {
      const { url } = await api.adminSubirImagenProducto(archivo);
      setImagenes((imgs) => [...imgs, { url, color: "" }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoImagen(false);
      e.target.value = "";
    }
  };

  const quitarImagen = (index) => {
    setImagenes((imgs) => imgs.filter((_, i) => i !== index));
  };

  const asignarColorImagen = (index, color) => {
    setImagenes((imgs) => imgs.map((img, i) => (i === index ? { ...img, color } : img)));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");

    if (imagenes.length < MINIMO_IMAGENES) {
      setError(`Sube al menos ${MINIMO_IMAGENES} imágenes del producto (llevas ${imagenes.length}).`);
      return;
    }

    setGuardando(true);
    const payload = {
      ...form,
      precio: parseFloat(form.precio),
      precio_oferta: form.precio_oferta ? parseFloat(form.precio_oferta) : null,
      stock: usaVariantes ? 0 : parseInt(form.stock, 10) || 0,
      categoria_id: parseInt(form.categoria_id, 10),
      tallas: tallasActuales,
      colores: coloresActuales,
      imagenes: imagenes.map((img) => ({ url: img.url, color: img.color || null })),
      variantes: usaVariantes
        ? combosActuales.map((combo) => ({
            talla: combo.talla,
            color: combo.color,
            stock: stockVariantes[claveCombo(combo.talla, combo.color)] || 0,
          }))
        : [],
    };

    try {
      if (editandoId) {
        await api.adminActualizarProducto(editandoId, payload);
      } else {
        await api.adminCrearProducto(payload);
      }
      setMostrarForm(false);
      cargarProductos(busqueda);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (p) => {
    if (!confirm(`¿Desactivar "${p.nombre}"? Ya no se mostrará en la tienda.`)) return;
    await api.adminEliminarProducto(p.id);
    cargarProductos(busqueda);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-plum">Productos</h1>
        <button
          onClick={nuevoProducto}
          className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
        >
          + Nuevo producto
        </button>
      </div>

      <input
        placeholder="Buscar producto..."
        value={busqueda}
        maxLength={80}
        onChange={(e) => {
          setBusqueda(e.target.value);
          cargarProductos(e.target.value);
        }}
        className="glass mb-4 w-full max-w-sm rounded-full px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
      />

      <div className="glass overflow-hidden rounded-3xl shadow-glass">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="border-t border-white/40">
                <td className="px-4 py-2">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lilac to-white" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-plum">{p.nombre}</td>
                <td className="px-4 py-3 text-plum-soft">{p.categoria_nombre}</td>
                <td className="px-4 py-3 text-plum-soft">S/ {p.precio_final.toFixed(2)}</td>
                <td className="px-4 py-3 text-plum-soft">
                  {p.stock}
                  {p.usa_variantes && <span className="ml-1 text-xs text-plum-soft">(por variante)</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.activo ? "bg-berry/10 text-berry-dark" : "bg-plum/10 text-plum-soft"
                    }`}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => editar(p)} className="mr-2 text-berry hover:underline">
                    Editar
                  </button>
                  <button onClick={() => eliminar(p)} className="text-plum-soft hover:text-berry">
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No hay productos todavía.</p>
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
            className="glass-strong relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 className="mb-4 font-display text-xl font-semibold text-plum">
              {editandoId ? "Editar producto" : "Nuevo producto"}
            </h2>

            <div className="space-y-3">
              <input
                placeholder="Nombre"
                required
                maxLength={150}
                value={form.nombre}
                onChange={actualizarCampo("nombre")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <textarea
                placeholder="Descripción"
                rows={2}
                maxLength={1000}
                value={form.descripcion}
                onChange={actualizarCampo("descripcion")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  required
                  value={form.precio}
                  onChange={actualizarCampo("precio")}
                  className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio oferta (opcional)"
                  value={form.precio_oferta}
                  onChange={actualizarCampo("precio_oferta")}
                  className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!usaVariantes && (
                  <input
                    type="number"
                    placeholder="Stock"
                    required
                    value={form.stock}
                    onChange={actualizarCampo("stock")}
                    className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                  />
                )}
                <input
                  placeholder="SKU (opcional)"
                  maxLength={60}
                  value={form.sku}
                  onChange={actualizarSku}
                  className={`rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none ${
                    usaVariantes ? "col-span-2" : ""
                  }`}
                />
              </div>

              <select
                required
                value={form.categoria_id}
                onChange={actualizarCampo("categoria_id")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              >
                <option value="">Selecciona categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <input
                placeholder="Colores separados por coma (ej: Negro, Beige)"
                maxLength={300}
                value={form.colores}
                onChange={actualizarCampo("colores")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Tallas separadas por coma (ej: S, M, L)"
                maxLength={200}
                value={form.tallas}
                onChange={actualizarCampo("tallas")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />

              {usaVariantes && (
                <div className="rounded-2xl bg-white/50 p-3">
                  <p className="mb-2 text-sm font-medium text-plum">
                    Stock por {tallasActuales.length && coloresActuales.length ? "talla y color" : tallasActuales.length ? "talla" : "color"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {combosActuales.map((combo) => {
                      const clave = claveCombo(combo.talla, combo.color);
                      const etiqueta = [combo.talla, combo.color].filter(Boolean).join(" / ");
                      return (
                        <label key={clave} className="glass flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs text-plum shadow-glass">
                          <span className="truncate">{etiqueta}</span>
                          <input
                            type="number"
                            min={0}
                            value={stockVariantes[clave] ?? 0}
                            onChange={(e) => actualizarStockVariante(combo.talla, combo.color, e.target.value)}
                            className="w-14 rounded-lg bg-white/80 px-1.5 py-1 text-right text-xs focus:outline-none"
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-plum-soft">
                    Total: {combosActuales.reduce((acc, combo) => acc + (stockVariantes[claveCombo(combo.talla, combo.color)] || 0), 0)} unidades
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 flex items-center justify-between text-sm font-medium text-plum">
                  <span>Imágenes del producto</span>
                  <span className={imagenes.length < MINIMO_IMAGENES ? "text-berry-dark" : "text-plum-soft"}>
                    {imagenes.length}/{MINIMO_IMAGENES} mínimo
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {imagenes.map((img, i) => (
                    <div key={i} className="glass relative space-y-1 rounded-2xl p-2 shadow-glass">
                      <button
                        type="button"
                        onClick={() => quitarImagen(i)}
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-berry text-white shadow-glass"
                        aria-label="Quitar imagen"
                      >
                        <IconClose size={12} />
                      </button>
                      <img src={img.url} alt={`Imagen ${i + 1}`} className="h-20 w-full rounded-xl object-cover" />
                      <select
                        value={img.color}
                        onChange={(e) => asignarColorImagen(i, e.target.value)}
                        className="w-full rounded-lg bg-white/80 px-1.5 py-1 text-xs text-plum focus:outline-none"
                      >
                        <option value="">Sin color específico</option>
                        {coloresDisponibles.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <label className="glass flex h-full min-h-[92px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl text-xs text-plum shadow-glass hover:bg-white">
                    <IconUpload size={18} />
                    {subiendoImagen ? "Subiendo..." : "Agregar imagen"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={subirImagen}
                      disabled={subiendoImagen}
                      className="hidden"
                    />
                  </label>
                </div>
                {coloresDisponibles.length > 0 && (
                  <p className="mt-1 text-xs text-plum-soft">
                    Si asignas un color a una imagen, se mostrará automáticamente cuando el
                    cliente elija ese color en la tienda.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 pt-1 text-sm text-plum">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.destacado} onChange={actualizarCampo("destacado")} />
                  Destacado
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.es_nuevo} onChange={actualizarCampo("es_nuevo")} />
                  Nuevo
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.activo} onChange={actualizarCampo("activo")} />
                  Activo
                </label>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-berry-dark">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-full bg-berry py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear producto"}
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
