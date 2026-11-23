import type { Metadata } from "next";
import { Maqueta } from "@/componentes/acceso/Maqueta";
import { FormIngresar } from "./FormIngresar";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false, follow: false } };
export const revalidate = 300;

export default function PaginaIngresar() {
  return (
    <Maqueta
      imagen="login"
      posicionImagen="18% 20%"
      conAtras
      altoMarca={320}
      anchoForm={420}
      padY={16}
      titulo={
        <>
          Bienvenido a
          <br />
          Anita New Style
        </>
      }
      marca={
        <p className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          Tu tienda de moda en Huancayo. Encuentra carteras, mochilas, vestidos y accesorios con estilo.
          <span className="mt-2 block font-medium text-berry">¡Delivery en Huancayo!</span>
        </p>
      }
    >
      <FormIngresar />
    </Maqueta>
  );
}
