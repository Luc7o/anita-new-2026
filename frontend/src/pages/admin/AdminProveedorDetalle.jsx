import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminProveedorDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeGestionar = ["superadmin", "editor"].includes(usuario?.rol);

  const [proveedor, setProveedor] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [seleccion, setSeleccion] = useState({ producto_id: "", precio_compra: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () => api.adminProveedor(id).then(setProveedor);

  useEffect(() => {
    cargar();
    api.adminProductos({ por_pagina: 200 }).then((data) => setProductosDisponibles(data.productos || []));
  }, [id]);

  const abrirForm = () => {
    setSeleccion({ producto_id: "", precio_compra: "" });
    setError("");
    setMostrarForm(true);
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!seleccion.producto_id) {
      setError("Selecciona un producto");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await api.adminAgregarProductoProveedor(id, seleccion);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const quitarProducto = async (relacion) => {
    if (!confirm(`¿Quitar "${relacion.producto?.nombre}" de este proveedor?`)) return;
    await api.adminQuitarProductoProveedor(id, relacion.id);
    cargar();
  };

  if (!proveedor) {
    return <p className="text-plum-soft">Cargando proveedor...</p>;
  }

  const productosYaAsociados = new Set(proveedor.productos.map((pp) => pp.producto_id));
  const opcionesSelect = productosDisponibles.filter((p) => !productosYaAsociados.has(p.id));

  return (
    <div>
      <Link to="/admin/proveedores" className="text-sm text-berry hover:underline">
        ← Volver a proveedores
      </Link>

      <div className="glass mt-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-plum">{proveedor.nombre}</h1>
            <p className="text-sm text-plum-soft">
              {proveedor.contacto_nombre && `${proveedor.contacto_nombre} · `}
              {proveedor.telefono || "sin teléfono"} {proveedor.email && `· ${proveedor.email}`}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              proveedor.activo ? "bg-berry/10 text-berry-dark" : "bg-plum/10 text-plum-soft"
            }`}
          >
            {proveedor.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        {proveedor.notas && (
          <p className="mt-3 rounded-2xl bg-white/50 p-3 text-sm text-plum-soft">{proveedor.notas}</p>
        )}

        <div className="mt-6 border-t border-white/50 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
              Productos que suministra
            </h2>
            {puedeGestionar && (
              <button
                onClick={abrirForm}
                className="rounded-full bg-berry px-4 py-2 text-xs font-semibold text-white shadow-glass transition hover:bg-berry-dark"
              >
                + Vincular producto
              </button>
            )}
          </div>

          {proveedor.productos.length === 0 ? (
            <p className="text-sm text-plum-soft">Este proveedor todavía no tiene productos vinculados.</p>
          ) : (
            <div className="space-y-2">
              {proveedor.productos.map((pp) => (
                <div
                  key={pp.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {pp.producto?.imagen_url && (
                      <img
                        src={pp.producto.imagen_url}
                        alt={pp.producto?.nombre}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-plum">{pp.producto?.nombre}</p>
                      <p className="text-xs text-plum-soft">
                        SKU: {pp.producto?.sku || "—"} · Stock actual: {pp.producto?.stock ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-plum-soft">
                      {pp.precio_compra != null ? `Costo: S/ ${pp.precio_compra.toFixed(2)}` : "Sin costo registrado"}
                    </span>
                    {puedeGestionar && (
                      <button
                        onClick={() => quitarProducto(pp)}
                        className="text-xs text-plum-soft hover:text-berry"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-plum/30 backdrop-blur-sm"
            onClick={() => setMostrarForm(false)}
            aria-label="Cerrar"
          />
          <form
            onSubmit={agregarProducto}
            className="glass-strong relative w-full max-w-md rounded-3xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 className="mb-4 font-display text-xl font-semibold text-plum">Vincular producto</h2>

            <div className="space-y-3">
              <select
                value={seleccion.producto_id}
                onChange={(e) => setSeleccion({ ...seleccion, producto_id: e.target.value })}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              >
                <option value="">Selecciona un producto...</option>
                {opcionesSelect.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.sku ? `(${p.sku})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio de compra (opcional)"
                value={seleccion.precio_compra}
                onChange={(e) => setSeleccion({ ...seleccion, precio_compra: e.target.value })}
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
                {guardando ? "Guardando..." : "Vincular"}
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
