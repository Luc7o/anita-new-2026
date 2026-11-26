import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Comprar } from "@/componentes/Comprar";
import { EtiquetaOferta } from "@/componentes/EtiquetaOferta";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { GaleriaProducto } from "@/componentes/producto/GaleriaProducto";
import { obtenerProducto, relacionados, type ProductoDetalle } from "@/lib/catalogo";
import { soles } from "@/lib/precio";
import { MARCA, URL_TIENDA } from "@/lib/sitio";

// La página se arma en el servidor y se guarda 60 s: Google, WhatsApp y Facebook reciben
// el HTML completo con nombre, precio y foto, sin ejecutar JavaScript.
export const revalidate = 60;

// Ninguna ficha se arma al compilar: cada una se genera en la primera visita y queda en caché.
export function generateStaticParams() {
  return [];
}

const cargar = cache(async (texto: string) => {
  const id = Number(texto);
  if (!Number.isInteger(id) || id <= 0) return null;
  return obtenerProducto(id);
});

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const producto = await cargar((await params).id);
  if (!producto) return { title: "Producto no disponible", robots: { index: false } };
  const descripcion = (
    producto.descripcion ||
    `${producto.nombre}${producto.categoria ? ` · ${producto.categoria.nombre}` : ""} a ${soles(producto.precioFinal)}. Recojo en tienda o envío en Huancayo.`
  )
    .replace(/\s+/g, " ")
    .slice(0, 160);
  const foto = producto.imagenes[0]?.url ?? producto.imagenUrl;
  return {
    title: producto.nombre,
    description: descripcion,
    alternates: { canonical: `/producto/${producto.id}` },
    openGraph: { type: "website", title: producto.nombre, description: descripcion, images: [foto ?? "/logo-anita-new-style.png"] },
  };
}

function jsonLd(p: ProductoDetalle) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.descripcion ?? undefined,
    sku: p.sku ?? undefined,
    image: p.imagenes.length ? p.imagenes.map((i) => i.url) : p.imagenUrl ? [p.imagenUrl] : undefined,
    brand: { "@type": "Brand", name: MARCA },
    category: p.categoria?.nombre,
    offers: {
      "@type": "Offer",
      url: `${URL_TIENDA}/producto/${p.id}`,
      priceCurrency: "PEN",
      price: p.precioFinal.toFixed(2),
      availability: p.sinStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(p.totalResenas > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: p.promedioCalificacion.toFixed(1),
        reviewCount: p.totalResenas,
      },
    }),
  };
}

export default async function PaginaProducto({ params }: PageProps<"/producto/[id]">) {
  const producto = await cargar((await params).id);
  if (!producto) notFound();
  const otros = await relacionados(producto);
  const fotos = producto.imagenes.length ? producto.imagenes : [{ id: 0, url: producto.imagenUrl ?? "", color: null }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(producto)).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Ruta" className="mb-6 text-sm text-plum-soft">
        <Link href="/" className="hover:text-berry">Inicio</Link> /{" "}
        <Link href="/tienda" className="hover:text-berry">Tienda</Link>
        {producto.categoria && (
          <>
            {" / "}
            <Link href={`/tienda?categoria=${encodeURIComponent(producto.categoria.slug)}`} className="hover:text-berry">
              {producto.categoria.nombre}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <GaleriaProducto fotos={fotos} nombre={producto.nombre} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {producto.categoria && (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-plum-soft">{producto.categoria.nombre}</p>
          )}
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight">{producto.nombre}</h1>
          <div className="mt-4 flex items-center gap-4">
            {producto.tieneOferta ? (
              <>
                <EtiquetaOferta precio={producto.precioFinal} antes={producto.precio} />
                <p className="text-sm">
                  Ahorras <b className="precio text-plum">{soles(producto.precio - producto.precioFinal)}</b>
                </p>
              </>
            ) : (
              <p className="precio text-2xl">{soles(producto.precioFinal)}</p>
            )}
          </div>
          {producto.descripcion && (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-plum-soft">{producto.descripcion}</p>
          )}

          <div className="mt-8">
            <Comprar
              productoId={producto.id}
              tallas={producto.tallas}
              colores={producto.colores}
              variantes={producto.variantes}
              sinStock={producto.sinStock}
            />
          </div>

          <ul className="mt-6 grid gap-2 border-t border-plum/10 pt-5 text-sm">
            <li><strong>Delivery en Huancayo</strong> · S/ 10.00 a tu puerta</li>
            <li><strong>Recojo en tienda</strong> · Gratis, con código de recojo</li>
            <li><strong>Paga con</strong> tarjeta de crédito o débito, o Yape</li>
          </ul>
        </div>
      </div>

      {otros.length > 0 && (
        <section className="mt-16" aria-labelledby="relacionados">
          <h2 id="relacionados" className="font-display text-2xl font-bold">También te puede interesar</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {otros.map((p, i) => (
              <TarjetaProducto key={p.id} producto={p} indice={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
