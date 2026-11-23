import Link from "next/link";
import { listarCategorias } from "@/lib/catalogo";

// Cabecera de la tienda. Ingresar y Carrito todavía viven en la SPA (mismo dominio):
// son enlaces normales (<a>), no <Link>, para que carguen esa app.
export async function Cabecera() {
  const categorias = await listarCategorias();
  return (
    <header className="sticky top-0 z-40 border-b border-plum/10 bg-ivory/90 backdrop-blur">
      <nav aria-label="Principal" className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold tracking-wide" aria-label="Anita New Style, ir al inicio">
          ANITA NEW STYLE
        </Link>
        <ul className="hidden items-center gap-5 text-sm font-semibold md:flex">
          <li><Link href="/tienda" className="hover:text-berry">Tienda</Link></li>
          {categorias.slice(0, 5).map((c) => (
            <li key={c.slug}>
              <Link href={`/tienda?categoria=${encodeURIComponent(c.slug)}`} className="hover:text-berry">{c.nombre}</Link>
            </li>
          ))}
          <li><Link href="/tienda?oferta=1" className="hover:text-berry">Ofertas</Link></li>
        </ul>
        <form action="/tienda" role="search" className="ml-auto hidden max-w-xs flex-1 sm:block">
          <label htmlFor="buscar" className="sr-only">Buscar en la tienda</label>
          <input
            id="buscar"
            name="q"
            type="search"
            placeholder="Buscar carteras, calzados..."
            className="w-full rounded-xl border border-plum/15 bg-white/70 px-4 py-2 text-sm outline-none focus:border-berry dark:bg-white/5"
          />
        </form>
        <div className="ml-auto flex items-center gap-4 text-sm font-semibold sm:ml-0">
          <a href="/ingresar" className="hover:text-berry">Ingresar</a>
          <a href="/carrito" className="rounded-xl bg-plum px-4 py-2 text-ivory hover:bg-black">Carrito</a>
        </div>
      </nav>
    </header>
  );
}
