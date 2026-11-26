"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoAjustes, IconoAyuda, IconoCorazon, IconoPaquete, IconoSalir, IconoUsuario } from "@/componentes/Iconos";
import { useSesion } from "./Sesion";

// Maqueta de Mi cuenta: menú fino a la izquierda (en celular, una fila que se desliza) y la
// sección a la derecha. La sección activa se marca con una línea. «Cerrar sesión» va al final
// del menú, separado de las secciones.
const ITEMS = [
  { href: "/perfil", texto: "Perfil", Icono: IconoUsuario, exacto: true },
  { href: "/perfil/pedidos", texto: "Pedidos", Icono: IconoPaquete },
  { href: "/perfil/favoritos", texto: "Favoritos", Icono: IconoCorazon },
  { href: "/perfil/configuracion", texto: "Configuración", Icono: IconoAjustes },
  { href: "/perfil/ayuda", texto: "Ayuda", Icono: IconoAyuda },
];

export function MaquetaCuenta({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const { salir } = useSesion();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="mb-6 font-display text-4xl font-bold text-plum">Mi cuenta</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        <nav
          aria-label="Mi cuenta"
          className="-mx-4 flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-plum/10 px-4 lg:mx-0 lg:w-48 lg:flex-col lg:self-start lg:border-b-0 lg:border-l lg:px-0"
        >
          {ITEMS.map(({ href, texto, Icono, exacto }) => {
            const activo = exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`-mb-px flex min-h-11 shrink-0 items-center gap-2.5 border-b-2 px-3 text-sm font-semibold transition-colors lg:-mb-0 lg:-ml-px lg:border-b-0 lg:border-l-2 lg:px-4 ${
                  activo ? "border-plum text-plum" : "border-transparent text-plum-soft hover:text-plum"
                }`}
              >
                <Icono size={17} />
                {texto}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => salir()}
            className="-mb-px ml-2 flex min-h-11 shrink-0 items-center gap-2.5 border-b-2 border-transparent px-3 text-sm font-semibold text-plum-soft transition-colors hover:text-peligro lg:-mb-0 lg:-ml-px lg:mt-4 lg:ml-0 lg:border-b-0 lg:border-l-2 lg:border-t lg:border-t-plum/10 lg:px-4 lg:pt-4"
          >
            <IconoSalir size={17} />
            Cerrar sesión
          </button>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function CargandoCuenta() {
  return (
    <div role="status" aria-label="Cargando tu cuenta" className="mx-auto max-w-5xl px-4 py-10">
      <div className="skeleton mb-6 h-10 w-48 rounded-lg" aria-hidden="true" />
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12" aria-hidden="true">
        <div className="skeleton h-11 w-full rounded-lg lg:h-60 lg:w-48" />
        <div className="skeleton h-96 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}
