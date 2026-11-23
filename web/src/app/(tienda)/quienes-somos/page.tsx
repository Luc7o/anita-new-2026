import type { Metadata } from "next";
import Link from "next/link";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { configTienda } from "@/lib/configTienda";

export const metadata: Metadata = { title: "Quiénes somos" };
export const revalidate = 300;

export default async function QuienesSomos() {
  const c = await configTienda();
  const ciudad = c.ciudad || "Huancayo";
  return (
    <PaginaInfo
      titulo="Quienes Somos"
      volver="/"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">{c.nombre_comercial}</strong> somos una tienda de moda peruana con pasión por el estilo y la calidad.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Nuestra historia</h3>
              <p className="mt-1 text-sm text-plum-soft">Nacimos en {ciudad} con el sueño de ofrecer moda peruana de calidad, seleccionando cada prenda con dedicación y amor por el detalle.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Nuestra misión</h3>
              <p className="mt-1 text-sm text-plum-soft">Somos una empresa ubicada en Huancayo dedicada a la
              comercialización de calzados, correas, mochilas y carteras de alta calidad,
              ofreciendo a nuestros clientes productos modernos, funcionales y accesibles
              económicamente. Nos comprometemos a brindar una experiencia de
              compra segura y satisfactoria, basada en la atención personalizada, y la
              variedad de productos.
              </p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Nuestra visión</h3>
              <p className="mt-1 text-sm text-plum-soft">Ser una empresa reconocida en Huancayo y en el mercado digital como una de las principales
              tiendas de moda y accesorios, destacándonos por la innovación, la calidad
              de nuestros productos, la variedad de diseños y la excelencia en el servicio
              al cliente.
              </p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">Nuestros valores</h3>
              <p className="mt-1 text-sm text-plum-soft">Calidad, honestidad, calidez y pasión por la moda. Cada prenda que elegimos cuenta una historia de esfuerzo y dedicación.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">Tienda física</p>
            {c.direccion || c.horario_atencion ? (
              <>
                {c.direccion && (
                  <p className="text-sm text-plum-soft">
                    {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ""}.
                    {c.referencia ? ` ${c.referencia}.` : ""}
                  </p>
                )}
                {c.horario_atencion && <p className="text-sm text-plum-soft">{c.horario_atencion}</p>}
              </>
            ) : (
              <p className="text-sm text-plum-soft">Mira dónde encontrarnos en la sección Nuestras tiendas.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/tienda" className="flex flex-1 items-center justify-center rounded-2xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark">
              Ver la tienda
            </Link>
            <Link href="/tiendas" className="flex flex-1 items-center justify-center rounded-2xl border border-plum/15 bg-white/70 px-5 py-3 text-sm font-medium text-plum shadow-glass transition hover:bg-white">
              Nuestras tiendas
            </Link>
          </div>
        </div>
      </PaginaInfo>
  );
}