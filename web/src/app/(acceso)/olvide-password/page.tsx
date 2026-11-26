import type { Metadata } from "next";
import { Redes } from "@/componentes/acceso/Redes";
import { TarjetaAcceso } from "@/componentes/acceso/TarjetaAcceso";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false, follow: false } };
export const revalidate = 300;

export default function PaginaOlvide() {
  return <TarjetaAcceso inicial="olvide" redes={<Redes />} />;
}
