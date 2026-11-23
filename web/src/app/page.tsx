import Link from "next/link";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { listarProductos } from "@/lib/catalogo";

export const revalidate = 60;

// Portada mínima mientras se migra la de la SPA (hero, campañas y promociones vienen después).
export default async function Inicio() {
  const { productos } = await listarProductos({ orden: "nuevos" });
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum-soft">Huancayo · Moda para toda la familia</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
          Anita, <em className="font-medium italic text-berry">elegida</em> para ti
        </h1>
        <Link href="/tienda" className="btn-primary mt-8 inline-flex px-8">Ver la tienda</Link>
      </section>
      <section aria-labelledby="nuevos" className="mt-6">
        <h2 id="nuevos" className="font-display text-2xl font-bold">Lo nuevo</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {productos.slice(0, 8).map((p, i) => <TarjetaProducto key={p.id} producto={p} indice={i} prioridad={i < 4} />)}
        </div>
      </section>
    </div>
  );
}
