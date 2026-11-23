import type { Metadata } from "next";
import Link from "next/link";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { configTienda } from "@/lib/configTienda";
import { URL_API } from "@/lib/sitio";
import { ListaResenas } from "./Resenas";
import { Estrellas, POR_PAGINA, type PaginaResenas } from "./comun";

export const metadata: Metadata = {
  title: "Opiniones de clientes",
  description: "Lo que dicen nuestros clientes de sus compras en Anita New Style.",
};
export const revalidate = 120;

async function primeraPagina(): Promise<PaginaResenas | null> {
  try {
    const r = await fetch(`${URL_API}/resenas?limite=${POR_PAGINA}&offset=0`, { next: { revalidate: 120 } });
    return r.ok ? ((await r.json()) as PaginaResenas) : null;
  } catch {
    return null;
  }
}

function Resumen({ total, promedio, distribucion }: Pick<PaginaResenas, "total" | "promedio" | "distribucion">) {
  return (
    <div className="grid gap-4 rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:px-6">
        <p className="text-4xl font-bold text-plum">{(promedio ?? 0).toFixed(1)}</p>
        <div className="mt-1 flex justify-center">
          <Estrellas valor={promedio ?? 0} size={16} />
        </div>
        <p className="mt-1 text-xs text-plum-soft">
          {total} {total === 1 ? "reseña" : "reseñas"}
        </p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const cantidad = distribucion[String(n)] || 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs text-plum-soft">
              <span className="w-3 text-right">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-plum/10">
                <div className="h-full rounded-full bg-berry" style={{ width: `${total ? (cantidad / total) * 100 : 0}%` }} />
              </div>
              <span className="w-6 text-right">{cantidad}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reseñas reales leídas de la base: no hay ningún texto de ejemplo.
export default async function PaginaReviews() {
  const [config, datos] = await Promise.all([configTienda(), primeraPagina()]);
  return (
    <PaginaInfo titulo="Reviews de clientes" volver="/">
      <div className="space-y-6">
        <p className="text-lg text-plum-soft">
          Opiniones reales de clientas de <strong className="text-plum">{config.nombre_comercial}</strong>. Solo pueden reseñar quienes
          compraron el producto.
        </p>

        {!datos ? (
          <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
            <p className="text-sm text-plum-soft">No pudimos cargar las reseñas. Intenta de nuevo en unos minutos.</p>
          </div>
        ) : datos.total === 0 ? (
          <div className="rounded-xl border border-plum/10 bg-plum/5 p-6 text-center">
            <p className="font-medium text-plum">Aún no hay reseñas</p>
            <p className="mt-1 text-sm text-plum-soft">Cuando una clienta califique un producto que compró, su opinión aparecerá aquí.</p>
            <Link
              href="/tienda"
              className="mt-4 inline-block rounded-2xl bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
            >
              Ver la tienda
            </Link>
          </div>
        ) : (
          <>
            <Resumen total={datos.total} promedio={datos.promedio} distribucion={datos.distribucion} />
            <ListaResenas inicial={datos} />
            <div className="rounded-xl border border-plum/10 bg-plum/5 p-5">
              <p className="text-sm font-medium text-plum">¿Ya compraste con nosotros?</p>
              <p className="mt-1 text-sm text-plum-soft">Entra al producto que compraste y deja tu reseña. Aparece aquí al instante.</p>
            </div>
          </>
        )}
      </div>
    </PaginaInfo>
  );
}
