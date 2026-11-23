import Image from "next/image";

// Foto de producto optimizada por Next (AVIF/WebP al tamaño justo para cada pantalla).
// Sin foto, se muestra la inicial del producto como en la tienda actual.
export function Foto({ url, alt, sizes, prioridad = false, className = "" }: { url: string | null; alt: string; sizes: string; prioridad?: boolean; className?: string }) {
  if (!url) {
    return (
      <div className={`foto-vacia flex h-full w-full items-center justify-center ${className}`}>
        <span className="font-display text-5xl font-extrabold text-plum/15">{alt.slice(0, 1)}</span>
      </div>
    );
  }
  const optimizable = url.includes(".public.blob.vercel-storage.com");
  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={prioridad}
      unoptimized={!optimizable}
      className={`object-cover ${className}`}
    />
  );
}
