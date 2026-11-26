import type { Metadata } from "next";
import { Cabecera } from "@/componentes/Cabecera";
import { Pie } from "@/componentes/Pie";
import { ProveedorSesion } from "@/componentes/cuenta/Sesion";
import { CargandoCuenta, MaquetaCuenta } from "@/componentes/cuenta/MaquetaCuenta";

// Mi cuenta: con la cabecera y el pie de la tienda, y solo con sesión.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutCuenta({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera />
      <main id="contenido">
        <ProveedorSesion cargando={<CargandoCuenta />}>
          <MaquetaCuenta>{children}</MaquetaCuenta>
        </ProveedorSesion>
      </main>
      <Pie />
    </>
  );
}
