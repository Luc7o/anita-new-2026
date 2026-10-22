import React from "react";

// Piezas de "skeleton" (esqueleto de carga): bloques con un brillo animado
// que ocupan el mismo espacio que el contenido real, para que la página no
// "salte" cuando llegan los datos. Cada contenedor avisa a los lectores de
// pantalla que está cargando (role="status" + texto oculto).

export function Skeleton({ className = "", ...resto }) {
  return <div aria-hidden="true" className={`skeleton rounded-lg ${className}`} {...resto} />;
}

// Contenedor accesible: un solo "Cargando…" para el lector de pantalla,
// aunque por dentro haya decenas de bloques.
export function SkeletonRegion({ etiqueta = "Cargando", className = "", children }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{etiqueta}…</span>
      {children}
    </div>
  );
}

// Misma estructura y proporciones que ProductCard (imagen 4:5, textos,
// precio y los dos botones) para evitar saltos de layout.
function SkeletonProductCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-2xl border border-plum/10 bg-white"
    >
      <div className="skeleton aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-5 pb-0">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between px-5 pb-2.5 pt-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2 px-5 pb-5 pt-1">
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({
  cantidad = 8,
  className = "grid grid-cols-2 gap-4 sm:grid-cols-3",
  etiqueta = "Cargando productos",
}) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className={className}>
      {Array.from({ length: cantidad }, (_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </SkeletonRegion>
  );
}

// Fila de "pills" de categorías del Home.
export function SkeletonPills({ cantidad = 5 }) {
  return (
    <SkeletonRegion etiqueta="Cargando categorías" className="flex gap-3 overflow-x-hidden pb-2">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />
      ))}
    </SkeletonRegion>
  );
}

// Líneas del carrito en el drawer (foto + textos + cantidad).
export function SkeletonLineasCarrito({ cantidad = 2 }) {
  return (
    <SkeletonRegion etiqueta="Cargando tu carrito" className="flex-1 space-y-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="glass flex gap-3 rounded-2xl p-3" aria-hidden="true">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <div className="mt-1 flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
      ))}
    </SkeletonRegion>
  );
}

// Filas genéricas (lista de pedidos, etc.).
export function SkeletonFilas({ cantidad = 3, etiqueta = "Cargando" }) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className="space-y-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="glass flex items-center justify-between rounded-2xl p-4 shadow-glass"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

// Página de detalle de producto: galería a la izquierda, ficha a la derecha.
export function SkeletonDetalleProducto() {
  return (
    <SkeletonRegion etiqueta="Cargando producto" className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4" aria-hidden="true">
        <div className="flex gap-2 md:w-20 md:shrink-0 md:flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-xl" />
          ))}
        </div>
        <div className="skeleton aspect-[4/5] flex-1 rounded-3xl" />
      </div>
      <div className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8" aria-hidden="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-40" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-12 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </SkeletonRegion>
  );
}

// Detalle de un pedido.
export function SkeletonPedidoDetalle() {
  return (
    <SkeletonRegion etiqueta="Cargando pedido" className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="glass space-y-3 rounded-3xl p-6 shadow-glass" aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="glass space-y-3 rounded-3xl p-6 shadow-glass" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

// Reseñas (lista de comentarios).
export function SkeletonResenas({ cantidad = 3 }) {
  return (
    <SkeletonRegion etiqueta="Cargando reseñas" className="space-y-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="space-y-2 border-b border-plum/10 pb-4" aria-hidden="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

// Fila del carrusel de "También te puede interesar".
export function SkeletonCarruselRelacionados({ cantidad = 5 }) {
  return (
    <SkeletonRegion etiqueta="Cargando productos relacionados" className="flex gap-4 overflow-x-hidden pb-2">
      {Array.from({ length: cantidad }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="w-40 shrink-0 rounded-xl border border-plum/10 p-3 sm:w-48"
        >
          <Skeleton className="h-40 w-full rounded-lg sm:h-48" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-16" />
        </div>
      ))}
    </SkeletonRegion>
  );
}
