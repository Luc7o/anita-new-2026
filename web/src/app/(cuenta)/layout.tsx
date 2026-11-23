import type { Metadata } from "next";
import { ProveedorSesion } from "@/componentes/cuenta/Sesion";
import { CargandoCuenta, MaquetaCuenta } from "@/componentes/cuenta/MaquetaCuenta";

// Mi cuenta: sin la cabecera de la tienda (como la SPA) y solo con sesión.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutCuenta({ children }: { children: React.ReactNode }) {
  return (
    <main id="contenido">
      <ProveedorSesion cargando={<CargandoCuenta />}>
        <MaquetaCuenta>{children}</MaquetaCuenta>
      </ProveedorSesion>
    </main>
  );
}
