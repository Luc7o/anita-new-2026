import type { Metadata } from "next";
import { VistaConfiguracion } from "./VistaConfiguracion";

export const metadata: Metadata = { title: "Configuración" };

export default function PaginaConfiguracion() {
  return <VistaConfiguracion />;
}
