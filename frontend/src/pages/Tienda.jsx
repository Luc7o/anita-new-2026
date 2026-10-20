import PageHeader from "../components/PageHeader.jsx";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import { Skeleton, SkeletonProductGrid } from "../components/Skeleton.jsx";
import FiltroPrecio from "../components/FiltroPrecio.jsx";
import { nombreColorAHex } from "../utils/colores.js";
import { IconCheck, IconChevronLeft, IconChevronRight, IconStar, IconClose } from "../components/Icons.jsx";

const TALLAS_PRENDA = ["XS", "S", "M", "L", "XL"];
const TALLAS_CALZADO = ["35", "36", "37", "38", "39", "40", "41", "42"];

function alternarEnLista(lista, valor) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

const OPCIONES_CALIFICACION = [4, 3, 2];
const POR_PAGINA_BUSQUEDA = 5; // cuando se busca algo, resultados de 5 en 5
const POR_PAGINA_CATALOGO = 24;

// Números de página a mostrar: primera, última y las cercanas a la actual ("1 … 4 5 6 … 12").
function paginasVisibles(actual, total) {
  const set = new Set([1, total, actual - 1, actual, actual + 1]);
  const orden = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const salida = [];
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) salida.push("…");
    salida.push(n);
  });
  return salida;
}

function SeccionFiltro({ titulo, children, primera = false }) {
  return (
    <div className={primera ? "" : "mt-6 border-t border-plum/10 pt-5"}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-plum">{titulo}</h2>
      {children}
    </div>
  );
}

// Casilla (varias a la vez) o botón de opción (una sola) con el mismo diseño de la tienda.
function OpcionFiltro({ marcado, onChange, etiqueta, tipo = "checkbox", nombre, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-plum">
      <input type={tipo} name={nombre} checked={marcado} onChange={onChange} className="sr-only" />
      {tipo === "radio" ? (
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${marcado ? "border-berry" : "border-plum/25"}`}>
          {marcado && <span className="h-2 w-2 rounded-full bg-berry" />}
        </span>
      ) : (
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${marcado ? "border-berry bg-berry text-white" : "border-plum/30 bg-white"}`}>
          {marcado && <IconCheck size={10} />}
        </span>
      )}
      <span className={marcado ? "font-medium text-berry-dark" : ""}>{children || etiqueta}</span>
    </label>
  );
}

function Estrellas({ cantidad }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-berry" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} size={13} relleno={n <= cantidad} className={n <= cantidad ? "" : "text-plum/25"} />
      ))}
    </span>
  );
}

export default function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const busqueda = searchParams.get("q") || "";
  const categoriasActivas = (searchParams.get("categoria") || "").split(",").filter(Boolean);
  const tallasActivas = (searchParams.get("tallas") || "").split(",").filter(Boolean);
  const soloOfertas = searchParams.get("oferta") === "true";
  const pagina = Number(searchParams.get("pagina")) || 1;
  const porPagina = (searchParams.get("q") || "").trim() ? POR_PAGINA_BUSQUEDA : POR_PAGINA_CATALOGO;
  const precioDesde = searchParams.get("precio_min") !== null ? Number(searchParams.get("precio_min")) : null;
  const precioHasta = searchParams.get("precio_max") !== null ? Number(searchParams.get("precio_max")) : null;
  const coloresActivos = (searchParams.get("colores") || "").split(",").filter(Boolean);
  const generosActivos = (searchParams.get("genero") || "").split(",").filter(Boolean);
  const calificacionMin = Number(searchParams.get("calificacion")) || 0;

  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [meta, setMeta] = useState({ total: 0, paginas: 1, pagina_actual: 1 });
  const [orden, setOrden] = useState("");
  const [cargando, setCargando] = useState(true);
  const [opciones, setOpciones] = useState(null); // rango de precios, colores y géneros que existen
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false); // solo en celular

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {});
    api.filtrosTienda().then(setOpciones).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = { por_pagina: porPagina, pagina };
    ["categoria", "tallas", "colores", "genero", "precio_min", "precio_max", "calificacion", "q"].forEach((clave) => {
      const valor = searchParams.get(clave);
      if (valor) params[clave] = valor;
    });
    if (soloOfertas) params.oferta = "true";
    if (orden) params.orden = orden;

    api
      .productos(params)
      .then((data) => {
        setProductos(data.productos);
        setMeta({ total: data.total, paginas: data.paginas, pagina_actual: data.pagina_actual });
      })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), orden]);

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
    actualizarParams({ q: "", categoria: alternarEnLista(categoriasActivas, slug).join(",") });
  };

  // Elegir una categoría empieza una nueva búsqueda por categoría: se borra el
  // texto buscado para que no se sumen.
  const elegirTodasLasCategorias = () => actualizarParams({ q: "", categoria: "" });

  const alternarColor = (color) => actualizarParams({ colores: alternarEnLista(coloresActivos, color).join(",") });
  const alternarGenero = (g) => actualizarParams({ genero: alternarEnLista(generosActivos, g).join(",") });
  const elegirCalificacion = (n) => actualizarParams({ calificacion: calificacionMin === n ? "" : String(n) });
  const cambiarPrecio = (desde, hasta) =>
    actualizarParams({ precio_min: desde === null ? "" : String(desde), precio_max: hasta === null ? "" : String(hasta) });

  const cantidadFiltros =
    categoriasActivas.length + tallasActivas.length + coloresActivos.length + generosActivos.length +
    (soloOfertas ? 1 : 0) + (calificacionMin ? 1 : 0) + (precioDesde !== null || precioHasta !== null ? 1 : 0);
  const hayFiltros = Boolean(busqueda) || cantidadFiltros > 0;
  const quitarFiltros = () => setSearchParams(new URLSearchParams());

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

  // Si la página pedida ya no existe (enlace viejo, o hay menos resultados), se vuelve a la primera.
  useEffect(() => {
    if (!cargando && productos.length === 0 && meta.total > 0 && pagina > 1) irAPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);

  const inicio = meta.total === 0 ? 0 : (meta.pagina_actual - 1) * porPagina + 1;
  const fin = Math.min(meta.pagina_actual * porPagina, meta.total);

  return (
    <div>
      <PageHeader
        eyebrow="Anita New Style"
        titulo={
          busqueda
            ? `Resultados para "${busqueda}"`
            : soloOfertas
              ? "Ofertas"
              : categoriaDestacada
                ? categoriaDestacada.nombre
                : "Nuestra tienda"
        }
        subtitulo={categoriaDestacada?.descripcion || "Filtra por categoría, talla o color y arma tu pedido."}
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      {/* Contador */}
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-plum-soft">
        <div aria-live="polite">
          {cargando ? (
            <Skeleton className="h-4 w-44" />
          ) : (
            <span className="animate-fade-in">
              {meta.total > 0
                ? `Mostrando ${inicio}-${fin} de ${meta.total} resultados`
                : "Sin resultados"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hayFiltros && (
            <button type="button" onClick={quitarFiltros} className="inline-flex items-center gap-1 font-semibold text-berry hover:underline">
              <IconClose size={12} /> Limpiar filtros
            </button>
          )}
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((v) => !v)}
            aria-expanded={filtrosAbiertos}
            aria-controls="panel-filtros"
            className="rounded-[10px] border border-plum/15 bg-white px-4 py-2 text-sm font-semibold text-plum lg:hidden"
          >
            Filtros{cantidadFiltros > 0 ? ` (${cantidadFiltros})` : ""}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar de filtros */}
        <aside className="w-full shrink-0 lg:w-64">
          <div
            id="panel-filtros"
            className={`panel p-5 lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto ${filtrosAbiertos ? "block" : "hidden"}`}
          >
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
            <SeccionFiltro titulo="Categorías">
              <div className="space-y-2.5">
                <OpcionFiltro
                  marcado={categoriasActivas.length === 0}
                  onChange={elegirTodasLasCategorias}
                  etiqueta="Todo"
                />
                {categorias.map((cat) => (
                  <OpcionFiltro
                    key={cat.id}
                    marcado={categoriasActivas.includes(cat.slug)}
                    onChange={() => alternarCategoria(cat.slug)}
                    etiqueta={cat.nombre}
                  />
                ))}
              </div>
            </SeccionFiltro>

            {/* Precio */}
            {opciones?.precio && opciones.precio.max > opciones.precio.min && (
              <SeccionFiltro titulo="Precio">
                <FiltroPrecio
                  minimo={opciones.precio.min}
                  maximo={opciones.precio.max}
                  desde={precioDesde}
                  hasta={precioHasta}
                  onCambio={cambiarPrecio}
                />
              </SeccionFiltro>
            )}

            {/* Calificación */}
            <SeccionFiltro titulo="Calificación">
              <div className="space-y-2.5">
                <OpcionFiltro
                  tipo="radio"
                  nombre="calificacion"
                  marcado={calificacionMin === 0}
                  onChange={() => actualizarParams({ calificacion: "" })}
                  etiqueta="Todas"
                />
                {OPCIONES_CALIFICACION.map((n) => (
                  <OpcionFiltro
                    key={n}
                    tipo="radio"
                    nombre="calificacion"
                    marcado={calificacionMin === n}
                    onChange={() => elegirCalificacion(n)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Estrellas cantidad={n} />
                      <span>y más</span>
                    </span>
                  </OpcionFiltro>
                ))}
              </div>
              {calificacionMin > 0 && (
                <p className="mt-2 text-[11px] text-plum-soft">Solo productos con reseñas.</p>
              )}
            </SeccionFiltro>

            {/* Colores */}
            {opciones?.colores?.length > 0 && (
              <SeccionFiltro titulo="Colores">
                <div className="flex flex-wrap gap-2">
                  {opciones.colores.map((color) => {
                    const marcado = coloresActivos.some((c) => c.toLowerCase() === color.toLowerCase());
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => alternarColor(color)}
                        aria-pressed={marcado}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          marcado ? "border-berry bg-berry/10 text-berry-dark" : "border-plum/15 bg-white text-plum hover:border-berry/40"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full border border-plum/20"
                          style={{ backgroundColor: nombreColorAHex(color) }}
                          aria-hidden="true"
                        />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </SeccionFiltro>
            )}

            {/* Género (solo si ya hay productos con género asignado) */}
            {opciones?.generos?.length > 0 && (
              <SeccionFiltro titulo="Género">
                <div className="space-y-2.5">
                  {opciones.generos.map((g) => (
                    <OpcionFiltro
                      key={g.valor}
                      marcado={generosActivos.includes(g.valor)}
                      onChange={() => alternarGenero(g.valor)}
                      etiqueta={g.etiqueta}
                    />
                  ))}
                </div>
              </SeccionFiltro>
            )}

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
            <SkeletonProductGrid cantidad={porPagina === POR_PAGINA_BUSQUEDA ? POR_PAGINA_BUSQUEDA : 9} />
          ) : productos.length === 0 ? (
            <div className="text-plum-soft">
              <p>
                {busqueda
                  ? `No encontramos productos para "${busqueda}"${categoriasActivas.length || tallasActivas.length || soloOfertas ? " con los filtros elegidos" : ""}.`
                  : "No encontramos productos con esos filtros."}
              </p>
              {hayFiltros && (
                <button type="button" onClick={quitarFiltros} className="mt-3 text-sm font-semibold text-berry hover:underline">
                  Quitar todos los filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {productos.map((producto, i) => (
                  <ProductCard key={producto.id} producto={producto} indice={i} />
                ))}
              </div>

              {meta.paginas > 1 && (
                <nav aria-label="Paginación de resultados" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => irAPagina(Math.max(1, meta.pagina_actual - 1))}
                    disabled={meta.pagina_actual <= 1}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-plum/15 px-3 text-sm font-medium text-plum transition hover:border-berry/40 disabled:opacity-30"
                  >
                    <IconChevronLeft size={14} /> Anterior
                  </button>
                  {paginasVisibles(meta.pagina_actual, meta.paginas).map((n, i) =>
                    n === "…" ? (
                      <span key={`p${i}`} className="px-1 text-plum-soft" aria-hidden="true">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => irAPagina(n)}
                        aria-label={`Página ${n}`}
                        aria-current={n === meta.pagina_actual ? "page" : undefined}
                        className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
                          n === meta.pagina_actual
                            ? "border-berry bg-berry/10 text-berry-dark"
                            : "border-plum/15 text-plum-soft hover:border-berry/40"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => irAPagina(Math.min(meta.paginas, meta.pagina_actual + 1))}
                    disabled={meta.pagina_actual >= meta.paginas}
                    className="inline-flex h-9 items-center gap-1 rounded-full bg-berry px-4 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-30"
                  >
                    Página siguiente <IconChevronRight size={14} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
