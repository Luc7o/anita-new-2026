import type { Metadata } from "next";
import { Maqueta } from "@/componentes/acceso/Maqueta";
import { FormRegistro } from "./FormRegistro";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false, follow: false } };
export const revalidate = 300;

export default function PaginaRegistro() {
  return (
    <Maqueta
      imagen="registro"
      conAtras
      altoMarca={280}
      anchoForm={460}
      padY={12}
      titulo={
        <>
          Regístrate
          <br />
          solo con tu correo
        </>
      }
      marca={
        <div className="mt-4 max-w-sm text-sm text-plum-soft sm:text-base">
          <p className="font-semibold text-berry">Beneficios ANITA NEW STYLE</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>Recibir notificaciones en tiempo real de tus pedidos.</li>
            <li>Revisar tus boletas online.</li>
            <li>Guardar medios de pago y direcciones favoritas.</li>
          </ul>
        </div>
      }
    >
      <FormRegistro />
    </Maqueta>
  );
}
