import type { Metadata } from "next";
import { Maqueta } from "@/componentes/acceso/Maqueta";
import { IconoAtras } from "@/componentes/Iconos";
import { FormRestablecer } from "./FormRestablecer";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
  // El enlace del correo lleva el token en la URL: que no viaje a otros sitios.
  referrer: "no-referrer",
};
export const revalidate = 300;

export default function PaginaRestablecer() {
  return (
    <Maqueta
      imagen="registro"
      altoMarca={280}
      anchoForm={420}
      padY={16}
      titulo={
        <>
          Crea tu Nueva
          <br />
          Contraseña
        </>
      }
      marca={
        <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          Elige una contraseña segura para proteger tu cuenta de Anita New Style.
        </p>
      }
    >
      <FormRestablecer />
      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm text-plum-soft">
        <IconoAtras size={14} />
        <a href="/ingresar" className="font-bold text-berry hover:underline">
          Volver a Iniciar Sesión
        </a>
      </p>
    </Maqueta>
  );
}
