import Link from "next/link";
import { IconoCamion, IconoCarrito, IconoEtiqueta, IconoFlecha, IconoTienda, IconoWhatsApp } from "@/componentes/Iconos";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { Hero } from "@/componentes/portada/Hero";
import { LoNuevo } from "@/componentes/portada/LoNuevo";
import type { ProductoResumen } from "@/lib/catalogo";
import { datosPortada } from "@/lib/portada";
import { soles } from "@/lib/precio";
import { COSTO_DELIVERY, MARCAS_TARJETA, enlaceWhatsApp } from "@/lib/tienda";

// La portada se arma en el servidor y se guarda 60 s: llega completa en el primer HTML,
// sin esqueletos de carga (antes eran cuatro pedidos a la API desde el navegador).
export const revalidate = 60;

function Ofertas({ ofertas }: { ofertas: ProductoResumen[] }) {
  if (ofertas.length === 0) return null;
  return (
    <section className="regla mx-auto max-w-7xl px-4 pb-18 pt-14 sm:px-8">
      <div className="revelar mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">
          Ofertas <em>de la semana</em>
        </h2>
        <Link href="/tienda?oferta=1" className="btn-secondary">
          Ver todas <IconoFlecha size={16} />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-3 sm:mx-0 sm:px-0">
        {ofertas.map((p, i) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[23.5%]">
            <TarjetaProducto producto={p} indice={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ComoComprar() {
  const whatsapp = enlaceWhatsApp("Hola, tengo una duda sobre un producto");
  const pasos = [
    { Icono: IconoCarrito, titulo: "Elige y agrega a tu bolsa", texto: "Ves el total con la entrega antes de pagar.", costo: "" },
    { Icono: IconoEtiqueta, titulo: "Paga con tarjeta o Yape", texto: `${MARCAS_TARJETA.join(", ")} o Yape, procesados por Culqi.`, costo: "" },
    { Icono: IconoTienda, titulo: "Recógelo en la tienda", texto: "Con tu código de 6 dígitos y tu DNI.", costo: "Gratis" },
    { Icono: IconoCamion, titulo: "O recíbelo en tu casa", texto: "Delivery dentro de Huancayo.", costo: soles(COSTO_DELIVERY) },
  ];
  return (
    <section className="regla mx-auto grid max-w-7xl gap-7 px-4 pb-0 pt-14 sm:px-8 md:grid-cols-[0.9fr_1.2fr] md:gap-16">
      <div className="revelar grid content-start gap-4 md:sticky md:top-28">
        <h2 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-none text-plum">
          Comprar aquí es como comprar <em>en la tienda</em>
        </h2>
        <p className="max-w-[38ch] text-[17px] text-plum-soft">
          La misma pieza, el mismo precio y la misma atención. Solo que la eliges desde tu celular.
        </p>
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2.5 font-bold text-plum underline decoration-1 underline-offset-4">
            <IconoWhatsApp size={18} /> ¿Dudas con una talla o un color? Escríbenos por WhatsApp
          </a>
        )}
      </div>
      <ol className="m-0 list-none p-0">
        {pasos.map(({ Icono, titulo, texto, costo }) => (
          <li key={titulo} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-[18px] gap-y-1 border-b border-plum/15 py-[22px] sm:grid-cols-[48px_minmax(0,1fr)_auto]">
            <span className="ico-redondo h-10! w-10! text-plum sm:h-12! sm:w-12!"><Icono size={20} /></span>
            <span className="grid gap-1">
              <b className="text-lg text-plum">{titulo}</b>
              <span className="text-[15px] text-plum-soft">{texto}</span>
            </span>
            {costo && <span className="precio col-start-2 whitespace-nowrap text-[17px] text-plum sm:col-start-3">{costo}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function Inicio() {
  const { diapositivas, categorias, ofertas, nuevos } = await datosPortada();
  const pestanas = [{ slug: "todo", nombre: "Todo" }, ...categorias.slice(0, 5).map(({ slug, nombre }) => ({ slug, nombre }))];
  return (
    <div>
      <Hero diapositivas={diapositivas} />
      {/* Las ofertas van primero, justo después del carrusel: son lo que más interesa vender. */}
      <Ofertas ofertas={ofertas} />
      <LoNuevo pestanas={pestanas} listas={nuevos} />
      <ComoComprar />
    </div>
  );
}
