import type { Metadata } from "next";
import { IconoAtras } from "@/componentes/Iconos";
import { BOTON_PANEL, MarcoAcceso, PanelTexto } from "@/componentes/acceso/MarcoAcceso";
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
    <MarcoAcceso
      titulo="Nueva contraseña"
      panel={
        <PanelTexto
          antetitulo="Último paso"
          titulo={<>Ya casi <em>terminas</em></>}
          texto="Elige una contraseña que no uses en otros sitios. Después entras con ella y tu correo."
          accion={
            <a href="/ingresar" className={BOTON_PANEL}>
              <IconoAtras size={15} /> Volver a iniciar sesión
            </a>
          }
        />
      }
    >
      <FormRestablecer />
    </MarcoAcceso>
  );
}
