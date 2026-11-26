import type { Metadata } from "next";
import { Redes } from "@/componentes/acceso/Redes";
import { TarjetaAcceso } from "@/componentes/acceso/TarjetaAcceso";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false, follow: false } };
export const revalidate = 300;

export default function PaginaRegistro() {
  return <TarjetaAcceso inicial="registro" redes={<Redes />} />;
}
