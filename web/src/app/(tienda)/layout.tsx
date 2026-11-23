import { Cabecera } from "@/componentes/Cabecera";
import { Pie } from "@/componentes/Pie";

export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecera />
      <main id="contenido">{children}</main>
      <Pie />
    </>
  );
}
