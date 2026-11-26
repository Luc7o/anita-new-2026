import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { BarraPrecio } from "@/componentes/tienda/BarraPrecio";
import { Desplegable } from "@/componentes/tienda/Desplegable";
import {
  GENEROS,
  listarCategorias,
  listarProductos,
  opcionesFiltros,
  type Genero,
  type Orden,
} from "@/lib/catalogo";

// Los filtros viven en la URL (?categoria=carteras&colores=Negro,Rojo&tallas=37&genero=mujer
// &precio_min=50&precio_max=120&orden=precio_asc&pagina=2): cada combinación es una página que se puede
// compartir, y todo funciona sin JavaScript (los menús son <details> y las opciones, enlaces).
type Params = {
  categoria?: string;
  q?: string;
  oferta?: string;
  orden?: string;
  pagina?: string;
  colores?: string;
  tallas?: string;
  genero?: string;
  precio_min?: string;
  precio_max?: string;
};

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: "nuevos", texto: "Lo más nuevo" },
  { valor: "precio_asc", texto: "Precio: menor a mayor" },
  { valor: "precio_desc", texto: "Precio: mayor a menor" },
];

/** "Negro,Rojo" -> ["Negro","Rojo"] (sin vacíos, sin repetir, con un tope por seguridad). */
/** Soles enteros y positivos; cualquier otra cosa se ignora. */
const soles = (v?: string) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
};
const lista = (v?: string) => [...new Set((v ?? "").split(",").map((x) => x.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);

function leer(p: Params) {
  const orden = ORDENES.some((o) => o.valor === p.orden) ? (p.orden as Orden) : "nuevos";
  const pagina = Number(p.pagina);
  return {
    categoria: p.categoria?.slice(0, 80) || undefined,
    q: p.q?.slice(0, 80) || undefined,
    oferta: p.oferta === "1" || p.oferta === "true",
    orden,
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
    colores: lista(p.colores),
    tallas: lista(p.tallas),
    generos: lista(p.genero).filter((g): g is Genero => GENEROS.some((x) => x.valor === g)),
    precioMin: soles(p.precio_min),
    precioMax: soles(p.precio_max),
  };
}
type Filtros = ReturnType<typeof leer>;

function enlace(base: Filtros, cambios: Partial<Filtros>) {
  const f = { ...base, pagina: 1, ...cambios };
  const u = new URLSearchParams();
  if (f.categoria) u.set("categoria", f.categoria);
  if (f.q) u.set("q", f.q);
  if (f.oferta) u.set("oferta", "1");
  if (f.colores.length) u.set("colores", f.colores.join(","));
  if (f.tallas.length) u.set("tallas", f.tallas.join(","));
  if (f.generos.length) u.set("genero", f.generos.join(","));
  if (f.precioMin !== undefined) u.set("precio_min", String(f.precioMin));
  if (f.precioMax !== undefined) u.set("precio_max", String(f.precioMax));
  if (f.orden !== "nuevos") u.set("orden", f.orden);
  if (f.pagina > 1) u.set("pagina", String(f.pagina));
  const texto = u.toString();
  return texto ? `/tienda?${texto}` : "/tienda";
}

/** Agrega o quita un valor de una lista (sin distinguir mayúsculas). */
function alternar<T extends string>(valores: T[], valor: T): T[] {
  const igual = (a: string) => a.toLowerCase() === valor.toLowerCase();
  return valores.some(igual) ? valores.filter((v) => !igual(v)) : [...valores, valor];
}
const incluye = (valores: string[], valor: string) => valores.some((v) => v.toLowerCase() === valor.toLowerCase());

const hayPrecio = (f: Filtros) => f.precioMin !== undefined || f.precioMax !== undefined;
const hayFiltros = (f: Filtros) => f.colores.length + f.tallas.length + f.generos.length > 0 || hayPrecio(f);

export async function generateMetadata({ searchParams }: PageProps<"/tienda">): Promise<Metadata> {
  const f = leer((await searchParams) as Params);
  const categorias = await listarCategorias();
  const cat = categorias.find((c) => c.slug === f.categoria);
  const titulo = f.q ? `Resultados para «${f.q}»` : cat ? cat.nombre : f.oferta ? "Ofertas" : "Tienda";
  return {
    title: titulo,
    description: cat
      ? `${cat.nombre} en Anita New Style, Huancayo. Recojo gratis en tienda o envío a domicilio.`
      : "Ropa, calzado y accesorios para mujer, hombre y niños. Filtra por color, talla, género y precio.",
    // La página canónica es la categoría (u oferta) sin filtros finos ni orden.
    alternates: { canonical: enlace({ ...f, colores: [], tallas: [], generos: [], precioMin: undefined, precioMax: undefined }, { orden: "nuevos", pagina: f.pagina }) },
    // Las búsquedas libres y las combinaciones de filtros no se indexan (contenido repetido).
    robots: f.q || hayFiltros(f) ? { index: false, follow: true } : undefined,
  };
}

// Casilla de cada opción dentro de un menú: un enlace que marca o desmarca.
function Opcion({ href, marcado, children }: { href: string; marcado: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={marcado ? "true" : undefined}
      className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${marcado ? "bg-lilac font-semibold text-plum" : "text-plum hover:bg-plum/5"}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${marcado ? "border-plum bg-plum text-ivory" : "border-plum/30"}`}
      >
        {marcado && (
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        )}
      </span>
      {children}
    </Link>
  );
}

export default async function Tienda({ searchParams }: PageProps<"/tienda">) {
  const f = leer((await searchParams) as Params);
  const [{ productos, total, pagina, paginas }, categorias, opciones] = await Promise.all([
    listarProductos(f),
    listarCategorias(),
    opcionesFiltros(f),
  ]);
  const cat = categorias.find((c) => c.slug === f.categoria);
  // Texto del precio elegido: "S/ 40 a S/ 120", "Desde S/ 40" o "Hasta S/ 120".
  const textoPrecio =
    f.precioMin !== undefined && f.precioMax !== undefined
      ? `S/ ${f.precioMin} a S/ ${f.precioMax}`
      : f.precioMin !== undefined
        ? `Desde S/ ${f.precioMin}`
        : f.precioMax !== undefined
          ? `Hasta S/ ${f.precioMax}`
          : null;
  // La barra arma su enlace sobre el resto de la dirección (sin precio ni página).
  const sinPrecio = enlace(f, { precioMin: undefined, precioMax: undefined });
  const textoOrden = ORDENES.find((o) => o.valor === f.orden)!.texto;

  // Filtros activos como etiquetas que se quitan con un clic.
  const etiquetas = [
    ...f.colores.map((c) => ({ texto: c, href: enlace(f, { colores: alternar(f.colores, c) }) })),
    ...f.tallas.map((t) => ({ texto: `Talla ${t}`, href: enlace(f, { tallas: alternar(f.tallas, t) }) })),
    ...f.generos.map((g) => ({ texto: GENEROS.find((x) => x.valor === g)!.texto, href: enlace(f, { generos: alternar(f.generos, g) }) })),
    ...(textoPrecio ? [{ texto: textoPrecio, href: sinPrecio }] : []),
  ];
  const sinFiltros = enlace(f, { colores: [], tallas: [], generos: [], precioMin: undefined, precioMax: undefined });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header>
        <h1 className="font-display text-4xl font-bold">
          {f.q ? `«${f.q}»` : cat ? cat.nombre : f.oferta ? "Ofertas" : "Tienda"}
        </h1>
        <p className="mt-1 text-sm text-plum-soft" aria-live="polite">
          {total} {total === 1 ? "producto" : "productos"}
        </p>
      </header>

      <nav aria-label="Categorías" className="mt-6 flex gap-2 overflow-x-auto pb-2 text-sm">
        <Link
          href={enlace(f, { categoria: undefined, oferta: false })}
          aria-current={!f.categoria && !f.oferta ? "true" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 font-semibold ${!f.categoria && !f.oferta ? "bg-lilac text-plum" : "hover:bg-plum/5"}`}
        >
          Todo
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.slug}
            href={enlace(f, { categoria: c.slug })}
            aria-current={f.categoria === c.slug ? "true" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 font-semibold ${f.categoria === c.slug ? "bg-lilac text-plum" : "hover:bg-plum/5"}`}
          >
            {c.nombre}
          </Link>
        ))}
        <Link
          href={enlace(f, { oferta: !f.oferta })}
          aria-current={f.oferta ? "true" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 font-semibold ${f.oferta ? "bg-lilac text-plum" : "hover:bg-plum/5"}`}
        >
          Ofertas
        </Link>
      </nav>

      {/* Barra de filtros y orden */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-plum/10 py-3">
        <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">Filtrar</span>

        {opciones.colores.length > 0 && (
          <Desplegable titulo="Color" activos={f.colores.length}>
            <div className="grid max-h-72 gap-0.5 overflow-y-auto">
              {opciones.colores.map((c) => (
                <Opcion key={c.nombre} href={enlace(f, { colores: alternar(f.colores, c.nombre) })} marcado={incluye(f.colores, c.nombre)}>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-full border border-plum/20"
                    style={{ backgroundColor: c.hex ?? "transparent" }}
                  />
                  {c.nombre}
                </Opcion>
              ))}
            </div>
          </Desplegable>
        )}

        {opciones.tallas.length > 0 && (
          <Desplegable titulo="Talla" activos={f.tallas.length}>
            <div className="grid max-h-72 grid-cols-2 gap-0.5 overflow-y-auto">
              {opciones.tallas.map((t) => (
                <Opcion key={t} href={enlace(f, { tallas: alternar(f.tallas, t) })} marcado={incluye(f.tallas, t)}>
                  {t}
                </Opcion>
              ))}
            </div>
          </Desplegable>
        )}

        {opciones.generos.length > 1 && (
          <Desplegable titulo="Género" activos={f.generos.length}>
            <div className="grid gap-0.5">
              {opciones.generos.map((g) => (
                <Opcion key={g.valor} href={enlace(f, { generos: alternar(f.generos, g.valor) })} marcado={f.generos.includes(g.valor)}>
                  {g.texto}
                </Opcion>
              ))}
            </div>
          </Desplegable>
        )}

        {opciones.precio && opciones.precio.max > opciones.precio.min && (
          <Desplegable titulo="Precio" activos={hayPrecio(f) ? 1 : 0}>
            <BarraPrecio
              min={opciones.precio.min}
              max={opciones.precio.max}
              desde={f.precioMin}
              hasta={f.precioMax}
              parametros={sinPrecio.split("?")[1] ?? ""}
            />
          </Desplegable>
        )}

        <div className="ml-auto">
          <Desplegable titulo={<><span className="hidden text-plum-soft sm:inline">Ordenar:</span> {textoOrden}</>} alinear="derecha">
            <div className="grid gap-0.5">
              {ORDENES.map((o) => (
                <Link
                  key={o.valor}
                  href={enlace(f, { orden: o.valor })}
                  scroll={false}
                  aria-current={f.orden === o.valor ? "true" : undefined}
                  className={`flex min-h-10 items-center rounded-xl px-3 text-sm ${f.orden === o.valor ? "bg-lilac font-semibold text-plum" : "text-plum hover:bg-plum/5"}`}
                >
                  {o.texto}
                </Link>
              ))}
            </div>
          </Desplegable>
        </div>
      </div>

      {etiquetas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {etiquetas.map((e) => (
            <Link
              key={e.texto}
              href={e.href}
              scroll={false}
              aria-label={`Quitar filtro ${e.texto}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lilac px-3 font-semibold text-plum transition-colors hover:bg-plum hover:text-ivory"
            >
              {e.texto}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </Link>
          ))}
          <Link href={sinFiltros} scroll={false} className="ml-1 font-semibold text-plum-soft underline underline-offset-4 hover:text-plum">
            Limpiar filtros
          </Link>
        </div>
      )}

      {productos.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl font-bold">No encontramos productos</p>
          <p className="mt-2 text-plum-soft">
            {hayFiltros(f) ? "Ningún producto cumple todos los filtros elegidos." : "Prueba con otra categoría o quita la búsqueda."}
          </p>
          <Link href={hayFiltros(f) ? sinFiltros : "/tienda"} className="btn-primary mt-6 inline-flex px-6">
            {hayFiltros(f) ? "Quitar los filtros" : "Ver toda la tienda"}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p, i) => (
            <TarjetaProducto key={p.id} producto={p} indice={i} prioridad={i < 4} />
          ))}
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas" className="mt-12 flex items-center justify-center gap-4 text-sm font-semibold">
          {pagina > 1 && <Link href={enlace(f, { pagina: pagina - 1 })} rel="prev" className="rounded-xl border border-plum/20 px-4 py-2">Anterior</Link>}
          <span>Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link href={enlace(f, { pagina: pagina + 1 })} rel="next" className="rounded-xl border border-plum/20 px-4 py-2">Siguiente</Link>}
        </nav>
      )}
    </div>
  );
}
