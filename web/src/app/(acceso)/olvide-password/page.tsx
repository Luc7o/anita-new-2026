import type { Metadata } from "next";
import { Maqueta } from "@/componentes/acceso/Maqueta";
import { FormOlvide } from "./FormOlvide";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false, follow: false } };
export const revalidate = 300;

export default function PaginaOlvide() {
  return (
    <Maqueta
      imagen="login"
      posicionImagen="18% 20%"
      altoMarca={320}
      anchoForm={420}
      padY={16}
      titulo={
        <>
          Recupera tu
          <br />
          Contraseña
        </>
      }
      marca={
        <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          No te preocupes. En Anita New Style cuidamos tu cuenta, te ayudamos a recuperar el acceso con unos simples pasos.
        </p>
      }
    >
      <FormOlvide />
    </Maqueta>
  );
}
