import React from "react";
import { Skeleton, SkeletonRegion } from "../Skeleton.jsx";

// Esqueletos del panel admin: ocupan el mismo espacio que el contenido final
// (filas de tabla, tarjetas de métricas, fichas de detalle y formularios).

/** Filas de una lista (productos, categorías, usuarios, pedidos…). */
export function SkeletonFilasAdmin({ cantidad = 5, etiqueta = "Cargando" }) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className="divide-y divide-plum/10">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Dashboard y reportes: fila de métricas + dos paneles. */
export function SkeletonPanelAdmin({ etiqueta = "Cargando" }) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className="space-y-6">
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-44 w-full" />
        </div>
        <div className="panel space-y-4 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
          <Skeleton className="h-3 w-3/6" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Detalle de un pedido o proveedor: cabecera + ficha + tabla. */
export function SkeletonDetalleAdmin({ etiqueta = "Cargando" }) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className="space-y-5">
      <div aria-hidden="true" className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div aria-hidden="true" className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel space-y-4 p-6">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="panel space-y-3 p-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** Formulario largo (configuración de la tienda). */
export function SkeletonFormularioAdmin({ etiqueta = "Cargando" }) {
  return (
    <SkeletonRegion etiqueta={etiqueta} className="space-y-5">
      <Skeleton aria-hidden="true" className="h-8 w-56" />
      <div aria-hidden="true" className="panel space-y-5 p-6">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-44" />
      </div>
    </SkeletonRegion>
  );
}
