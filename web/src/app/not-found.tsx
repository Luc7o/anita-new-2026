import Link from "next/link";
import { Cabecera } from "@/componentes/Cabecera";
import { Pie } from "@/componentes/Pie";

// Vive en la raíz (no en el grupo de la tienda), así que trae su propia cabecera y pie.
export default function NoEncontrada() {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-display text-5xl font-bold">No encontramos esta página</p>
        <p className="mt-4 text-plum-soft">Puede que el producto ya no esté disponible.</p>
        <Link href="/tienda" className="btn-primary mt-8 inline-flex px-6">Ir a la tienda</Link>
      </main>
      <Pie />
    </>
  );
}
