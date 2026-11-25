"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconoAjustes,
  IconoAtras,
  IconoAyuda,
  IconoCorazon,
  IconoEtiqueta,
  IconoPaquete,
  IconoUsuario,
} from "@/componentes/Iconos";

// Maqueta de Mi cuenta: menú a la
// izquierda y la sección a la derecha.
const ITEMS = [
  { href: "/perfil", texto: "Perfil", Icono: IconoUsuario, exacto: true },
  { href: "/perfil/pedidos", texto: "Pedidos", Icono: IconoPaquete },
  { href: "/perfil/favoritos", texto: "Favoritos", Icono: IconoCorazon },
  { href: "/tienda?oferta=1", texto: "Ofertas", Icono: IconoEtiqueta },
  { href: "/perfil/configuracion", texto: "Configuración", Icono: IconoAjustes },
  { href: "/perfil/ayuda", texto: "Ayuda", Icono: IconoAyuda },
];

export function MaquetaCuenta({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  return (
    <div className="min-h-screen">
      <Link
        href="/"
        aria-label="Volver al inicio"
        title="Volver al inicio"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-plum transition hover:bg-white/70 hover:text-berry sm:left-6 sm:top-6"
      >
        <IconoAtras size={18} />
      </Link>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="mb-8 text-3xl font-semibold text-plum">Mi Cuenta</h1>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-60">
            <nav aria-label="Mi cuenta" className="glass space-y-1 rounded-2xl p-3 shadow-glass">
              {ITEMS.map(({ href, texto, Icono, exacto }) => {
                const base = href.split("?")[0]!;
                const activo = exacto ? ruta === base : ruta === base || ruta.startsWith(`${base}/`);
                return (
                  <Link
                    key={texto}
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      activo ? "bg-berry/10 text-berry-dark" : "text-plum-soft hover:bg-white/70 hover:text-plum"
                    }`}
                  >
                    <Icono size={17} />
                    {texto}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/tienda"
              className="glass mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-semibold text-plum shadow-glass transition hover:bg-white/70 hover:text-berry"
            >
              <IconoAtras size={16} />
              Volver a la tienda
            </Link>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function CargandoCuenta() {
  return (
    <div role="status" aria-label="Cargando tu cuenta" className="mx-auto max-w-5xl px-4 py-14">
      <div className="skeleton mb-8 h-9 w-48 rounded-lg" aria-hidden="true" />
      <div className="flex flex-col gap-8 lg:flex-row" aria-hidden="true">
        <div className="skeleton h-72 w-full rounded-2xl lg:w-60" />
        <div className="skeleton h-96 flex-1 rounded-3xl" />
      </div>
    </div>
  );
}
