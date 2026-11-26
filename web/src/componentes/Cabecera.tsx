import Link from "next/link";
import { BotonTema } from "./BotonTema";
import { BuscadorMovil } from "./BuscadorMovil";
import { MenuCuenta } from "./MenuCuenta";

// Cabecera de la tienda: logo, buscador, modo noche/claro, cuenta y carrito. Los enlaces de la
// derecha (cuenta y carrito) son <a> con recarga completa: así cada página arranca con la
// sesión recién recuperada.
export function Cabecera() {
  return (
    <header className="sticky top-0 z-40 border-b border-plum/10 bg-ivory/90 backdrop-blur">
      <nav aria-label="Principal" className="relative mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:justify-center sm:gap-8">
        <Link href="/" className="whitespace-nowrap font-display text-[1.05rem] font-bold tracking-normal text-plum sm:text-xl sm:tracking-wide" aria-label="Anita New Style, ir al inicio">
          ANITA <span className="text-berry">NEW</span> STYLE
        </Link>
        <form action="/tienda" role="search" className="relative hidden w-full max-w-xl flex-1 sm:block">
          <label htmlFor="buscar" className="sr-only">Buscar en la tienda</label>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-plum-soft"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            id="buscar"
            name="q"
            type="search"
            placeholder="Buscar productos"
            className="h-11 w-full rounded-full border border-plum/15 bg-transparent pl-10 pr-4 text-sm font-normal text-plum outline-none transition-colors duration-300 placeholder:text-plum-soft focus:border-berry"
          />
        </form>
        <div className="ml-auto flex shrink-0 items-center gap-1 text-sm font-semibold sm:ml-0 sm:gap-4">
          <BuscadorMovil />
          <BotonTema />
          <MenuCuenta />
          <a
            href="/carrito"
            aria-label="Carrito"
            className="grid h-10 w-10 place-items-center rounded-xl bg-plum text-ivory hover:bg-black sm:block sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          >
            {/* En celular, solo la bolsa (el texto no cabe junto al logo). */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5 sm:hidden">
              <path d="M5.5 8h13l-1 12.5h-11z" />
              <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
            </svg>
            <span className="hidden sm:inline">Carrito</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
