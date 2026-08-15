import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import CategoryPill from "../components/CategoryPill.jsx";

export default function Tienda() {
  const [searchParams] = useSearchParams();
  const categoriaActiva = searchParams.get("categoria") || "";
  const busqueda = searchParams.get("q") || "";

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [orden, setOrden] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { por_pagina: 24 };
    if (categoriaActiva) params.categoria = categoriaActiva;
    if (busqueda) params.q = busqueda;
    if (orden) params.orden = orden;

    api
      .productos(params)
      .then((data) => setProductos(data.productos))
      .finally(() => setCargando(false));
  }, [categoriaActiva, busqueda, orden]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <h1 className="mb-6 font-display text-3xl font-semibold text-plum">
        {busqueda ? `Resultados para "${busqueda}"` : "Tienda"}
      </h1>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <CategoryPill key={cat.id} categoria={cat} activo={cat.slug === categoriaActiva} />
          ))}
        </div>

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="glass rounded-full px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
        >
          <option value="">Más recientes</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
      </div>

      {cargando ? (
        <p className="text-plum-soft">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="text-plum-soft">No encontramos productos con esos filtros.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}
