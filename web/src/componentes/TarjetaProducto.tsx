import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { quedanPocas, soles } from "@/lib/precio";
import { EtiquetaOferta } from "./EtiquetaOferta";
import { Foto } from "./Foto";

// Tarjeta «Anita, elegida»: foto enmarcada, aviso «Nuevo»/«Quedan N» y etiqueta kraft si hay oferta.
export function TarjetaProducto({ producto, indice = 0, prioridad = false }: { producto: ProductoResumen; indice?: number; prioridad?: boolean }) {
  const pocas = !producto.sinStock && quedanPocas(producto.stock);
  return (
    <article className="tarjeta group relative flex animate-fade-in-up flex-col" style={{ animationDelay: `${Math.min(indice, 12) * 60}ms` }}>
      <div className="relative">
        <Link href={`/producto/${producto.id}`} className="relative block aspect-4/5 w-full overflow-hidden rounded-md bg-[#ecebee]">
          <Foto url={producto.imagenUrl} alt={producto.nombre} prioridad={prioridad} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="tarjeta-foto" />
          {producto.sinStock ? (
            <span className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 py-2.5 text-center text-sm font-bold text-plum-soft">Agotado</span>
          ) : pocas ? (
            <span className="aviso-fino aviso-m absolute bottom-3 left-3">Quedan {producto.stock}</span>
          ) : producto.esNuevo ? (
            <span className="aviso-fino absolute bottom-3 left-3">Nuevo</span>
          ) : null}
        </Link>
        {producto.tieneOferta && (
          <EtiquetaOferta chica precio={producto.precioFinal} antes={producto.precio} className="absolute -right-1 top-0" />
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {producto.categoria && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-plum-soft">{producto.categoria.nombre}</p>}
        <Link href={`/producto/${producto.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-berry">{producto.nombre}</Link>
        <p className="precio text-base">
          {soles(producto.precioFinal)}
          {producto.tieneOferta && <s className="ml-2 text-sm font-medium text-plum-soft">{soles(producto.precio)}</s>}
        </p>
      </div>
    </article>
  );
}
