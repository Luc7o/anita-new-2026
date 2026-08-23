import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import { IconCheck, IconChevronLeft, IconChevronRight } from "../components/Icons.jsx";

const TALLAS_PRENDA = ["XS", "S", "M", "L", "XL"];
const TALLAS_CALZADO = ["36", "37", "38", "39", "40", "41", "42"];
const VOLUMENES = ["Grande", "Mediano", "Pequeño"];

function alternarEnLista(lista, valor) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

export default function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get("q") || "";
  const categoriasActivas = (searchParams.get("categoria") || "").split(",").filter(Boolean);
  const tallasActivas = (searchParams.get("tallas") || "").split(",").filter(Boolean);
  const soloOfertas = searchParams.get("oferta") === "true";
  const pagina = Number(searchParams.get("pagina")) || 1;

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [meta, setMeta] = useState({ total: 0, paginas: 1, pagina_actual: 1 });
  const [volumenActivo, setVolumenActivo] = useState("");
  const [orden, setOrden] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { por_pagina: 24, pagina };
    if (categoriasActivas.length) params.categoria = categoriasActivas.join(",");
    if (tallasActivas.length) params.tallas = tallasActivas.join(",");
    if (soloOfertas) params.oferta = "true";
    if (busqueda) params.q = busqueda;
    if (orden) params.orden = orden;

    api
      .productos(params)
      .then((data) => {
        setProductos(data.productos);
        setMeta({ total: data.total, paginas: data.paginas, pagina_actual: data.pagina_actual });
      })
      .finally(() => setCargando(false));
  }, [categoriasActivas.join(","), tallasActivas.join(","), soloOfertas, busqueda, orden, pagina]);

  const actualizarParams = (cambios) => {
    const nuevos = new URLSearchParams(searchParams);
    Object.entries(cambios).forEach(([clave, valor]) => {
      if (valor) nuevos.set(clave, valor);
      else nuevos.delete(clave);
    });
    nuevos.delete("pagina");
    setSearchParams(nuevos);
  };

  const alternarCategoria = (slug) => {
    actualizarParams({ categoria: alternarEnLista(categoriasActivas, slug).join(",") });
  };

  const seleccionarSoloCategoria = (slug) => {
    actualizarParams({ categoria: categoriasActivas.length === 1 && categoriasActivas[0] === slug ? "" : slug });
  };

  const alternarTalla = (talla) => {
    actualizarParams({ tallas: alternarEnLista(tallasActivas, talla).join(",") });
  };

  const irAPagina = (n) => {
    const nuevos = new URLSearchParams(searchParams);
    nuevos.set("pagina", String(n));
    setSearchParams(nuevos);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoriaDestacada =
    categoriasActivas.length === 1
      ? categorias.find((c) => c.slug === categoriasActivas[0])
      : null;

  const inicio = meta.total === 0 ? 0 : (meta.pagina_actual - 1) * 24 + 1;
  const fin = Math.min(meta.pagina_actual * 24, meta.total);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* Tabs de categoría */}
      <nav className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {categorias.map((cat) => {
          const activo = categoriasActivas.length === 1 && categoriasActivas[0] === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => seleccionarSoloCategoria(cat.slug)}
              aria-current={activo ? "true" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-glass transition hover:-translate-y-0.5 ${
                activo
                  ? "bg-berry text-white"
                  : "glass text-plum hover:bg-white/80 hover:text-berry-dark"
              }`}
            >
              {cat.nombre}
            </button>
          );
        })}
      </nav>
      <div className="mb-6 border-b border-plum/10" />

      {/* Encabezado */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-plum">
            {busqueda ? (
              `Resultados para "${busqueda}"`
            ) : soloOfertas ? (
              "Ofertas"
            ) : categoriaDestacada ? (
              categoriaDestacada.nombre
            ) : (
              "Tienda"
            )}
            {categoriaDestacada && (
              <span className="text-berry-dark"> de Autor</span>
            )}
          </h1>
          {categoriaDestacada?.descripcion && (
            <p className="mt-1 text-sm text-plum-soft">{categoriaDestacada.descripcion}</p>
          )}
        </div>
        <p className="text-sm text-plum-soft">
          {cargando
            ? "Cargando..."
            : meta.total > 0
            ? `Mostrando ${inicio}-${fin} de ${meta.total} resultados`
            : "Sin resultados"}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar de filtros */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="glass sticky top-20 rounded-2xl p-5 shadow-glass">
            {/* Ordenar */}
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-plum">
                Ordenar por
              </h2>
              <div className="space-y-2.5">
                {[
                  { valor: "", etiqueta: "Más recientes" },
                  { valor: "precio_asc", etiqueta: "Precio: menor a mayor" },
                  { valor: "precio_desc", etiqueta: "Precio: mayor a menor" },
                ].map((op) => {
                  const marcado = orden === op.valor;
                  return (
                    <label
                      key={op.valor || "recientes"}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-plum"
                    >
                      <input
                        type="radio"
                        name="orden"
                        checked={marcado}
                        onChange={() => setOrden(op.valor)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          marcado ? "border-berry" : "border-plum/25"
                        }`}
                      >
                        {marcado && <span className="h-2 w-2 rounded-full bg-berry" />}
                      </span>
                      <span className={marcado ? "font-medium text-berry-dark" : ""}>
                        {op.etiqueta}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Categorías */}
            <div className="mt-6 border-t border-plum/10 pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-plum">
                Categorías
              </h2>
              <div className="space-y-2.5">
                {categorias.map((cat) => {
                  const marcado = categoriasActivas.includes(cat.slug);
                  return (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-plum"
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternarCategoria(cat.slug)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${
                          marcado ? "border-berry bg-berry text-white" : "border-plum/30 bg-white"
                        }`}
                      >
                        {marcado && <IconCheck size={10} />}
                      </span>
                      <span className={marcado ? "font-medium text-berry-dark" : ""}>
                        {cat.nombre}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Volumen */}
            <div className="mt-6 border-t border-plum/10 pt-5">
              <h2 className="mb-0.5 text-xs font-bold uppercase tracking-widest text-plum">
                Volumen
              </h2>
              <p className="mb-3 text-[11px] text-plum-soft/70">Próximamente</p>
              <div className="space-y-2.5">
                {VOLUMENES.map((v) => {
                  const marcado = volumenActivo === v;
                  return (
                    <label
                      key={v}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-plum-soft/60"
                    >
                      <input
                        type="radio"
                        name="volumen"
                        checked={marcado}
                        onChange={() => setVolumenActivo(marcado ? "" : v)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          marcado ? "border-berry" : "border-plum/25"
                        }`}
                      >
                        {marcado && <span className="h-2 w-2 rounded-full bg-berry" />}
                      </span>
                      {v}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tallas prenda */}
            <div className="mt-6 border-t border-plum/10 pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-plum">
                Tallas Prendas
              </h2>
              <div className="flex flex-wrap gap-2">
                {TALLAS_PRENDA.map((t) => {
                  const marcado = tallasActivas.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => alternarTalla(t)}
                      aria-pressed={marcado}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                        marcado
                          ? "border-berry bg-berry text-white"
                          : "border-plum/15 bg-white text-plum hover:border-berry/40"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tallas calzado */}
            <div className="mt-6 border-t border-plum/10 pt-5">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-plum">
                Tallas Calzado
              </h2>
              <div className="flex flex-wrap gap-2">
                {TALLAS_CALZADO.map((t) => {
                  const marcado = tallasActivas.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => alternarTalla(t)}
                      aria-pressed={marcado}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                        marcado
                          ? "border-berry bg-berry text-white"
                          : "border-plum/15 bg-white text-plum hover:border-berry/40"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Resultados */}
        <div className="min-w-0 flex-1">
          {cargando ? (
            <p className="text-plum-soft">Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p className="text-plum-soft">No encontramos productos con esos filtros.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {productos.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>

              {meta.paginas > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => irAPagina(Math.max(1, meta.pagina_actual - 1))}
                    disabled={meta.pagina_actual <= 1}
                    aria-label="Página anterior"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-plum/15 text-plum transition hover:border-berry/40 disabled:opacity-30"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  {Array.from({ length: meta.paginas }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => irAPagina(n)}
                      aria-current={n === meta.pagina_actual ? "page" : undefined}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
                        n === meta.pagina_actual
                          ? "border-berry text-berry-dark"
                          : "border-plum/15 text-plum-soft hover:border-berry/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => irAPagina(Math.min(meta.paginas, meta.pagina_actual + 1))}
                    disabled={meta.pagina_actual >= meta.paginas}
                    aria-label="Página siguiente"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-plum/15 text-plum transition hover:border-berry/40 disabled:opacity-30"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
