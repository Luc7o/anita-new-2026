import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { listarCategorias, listarProductos, type Orden } from "@/lib/catalogo";

// Los filtros viven en la URL (?categoria=polos&orden=precio_asc&pagina=2): cada combinación
// es una página que se puede compartir e indexar, y funciona sin JavaScript.
type Params = { categoria?: string; q?: string; oferta?: string; orden?: string; pagina?: string };

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: "nuevos", texto: "Lo más nuevo" },
  { valor: "precio_asc", texto: "Precio: menor a mayor" },
  { valor: "precio_desc", texto: "Precio: mayor a menor" },
];

function leer(p: Params) {
  const orden = ORDENES.some((o) => o.valor === p.orden) ? (p.orden as Orden) : "nuevos";
  const pagina = Number(p.pagina);
  return {
    categoria: p.categoria?.slice(0, 80) || undefined,
    q: p.q?.slice(0, 80) || undefined,
    oferta: p.oferta === "1" || p.oferta === "true",
    orden,
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

function enlace(base: ReturnType<typeof leer>, cambios: Partial<ReturnType<typeof leer>>) {
  const f = { ...base, pagina: 1, ...cambios };
  const u = new URLSearchParams();
  if (f.categoria) u.set("categoria", f.categoria);
  if (f.q) u.set("q", f.q);
  if (f.oferta) u.set("oferta", "1");
  if (f.orden !== "nuevos") u.set("orden", f.orden);
  if (f.pagina > 1) u.set("pagina", String(f.pagina));
  const texto = u.toString();
  return texto ? `/tienda?${texto}` : "/tienda";
}

export async function generateMetadata({ searchParams }: PageProps<"/tienda">): Promise<Metadata> {
  const f = leer((await searchParams) as Params);
  const categorias = await listarCategorias();
  const cat = categorias.find((c) => c.slug === f.categoria);
  const titulo = f.q ? `Resultados para «${f.q}»` : cat ? cat.nombre : f.oferta ? "Ofertas" : "Tienda";
  return {
    title: titulo,
    description: cat
      ? `${cat.nombre} en Anita New Style, Huancayo. Recojo gratis en tienda o envío a domicilio.`
      : "Ropa, calzado y accesorios para mujer, hombre y niños. Filtra por categoría y precio.",
    alternates: { canonical: enlace(f, { orden: "nuevos", pagina: f.pagina }) },
    // Las búsquedas libres no se indexan (contenido repetido y sin fin).
    robots: f.q ? { index: false, follow: true } : undefined,
  };
}

export default async function Tienda({ searchParams }: PageProps<"/tienda">) {
  const f = leer((await searchParams) as Params);
  const [{ productos, total, pagina, paginas }, categorias] = await Promise.all([listarProductos(f), listarCategorias()]);
  const cat = categorias.find((c) => c.slug === f.categoria);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">
            {f.q ? `«${f.q}»` : cat ? cat.nombre : f.oferta ? "Ofertas" : "Tienda"}
          </h1>
          <p className="mt-1 text-sm text-plum-soft">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
        </div>
        <nav aria-label="Ordenar" className="flex flex-wrap gap-2 text-sm">
          {ORDENES.map((o) => (
            <Link
              key={o.valor}
              href={enlace(f, { orden: o.valor })}
              aria-current={f.orden === o.valor ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 font-semibold ${f.orden === o.valor ? "border-plum bg-plum text-ivory" : "border-plum/15 hover:border-plum"}`}
            >
              {o.texto}
            </Link>
          ))}
        </nav>
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

      {productos.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl font-bold">No encontramos productos</p>
          <p className="mt-2 text-plum-soft">Prueba con otra categoría o quita la búsqueda.</p>
          <Link href="/tienda" className="btn-primary mt-6 inline-flex px-6">Ver toda la tienda</Link>
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
