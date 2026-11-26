"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";
import type { ProductoResumen } from "@/lib/catalogo";
import { TarjetaProducto } from "@/componentes/TarjetaProducto";
import { IconoCorazon } from "@/componentes/Iconos";
import { useSesion } from "@/componentes/cuenta/Sesion";

// Producto tal como lo devuelve GET /api/favoritos (Producto.to_dict del backend).
type ProductoApi = {
  id: number;
  nombre: string;
  precio: number;
  precio_oferta: number | null;
  precio_final: number;
  tiene_oferta: boolean;
  descuento_porcentaje: number;
  imagen_url: string | null;
  categoria: string | null;
  categoria_nombre: string | null;
  destacado: boolean;
  es_nuevo: boolean;
  sin_stock: boolean;
  stock: number;
  promedio_calificacion: number;
  total_resenas: number;
};

const aResumen = (p: ProductoApi): ProductoResumen => ({
  id: p.id,
  nombre: p.nombre,
  precio: p.precio,
  precioOferta: p.precio_oferta,
  precioFinal: p.precio_final,
  tieneOferta: p.tiene_oferta,
  descuentoPorcentaje: p.descuento_porcentaje,
  imagenUrl: p.imagen_url || null,
  categoria: p.categoria ? { slug: p.categoria, nombre: p.categoria_nombre ?? p.categoria } : null,
  esNuevo: p.es_nuevo,
  destacado: p.destacado,
  stock: p.stock,
  sinStock: p.sin_stock,
  promedioCalificacion: p.promedio_calificacion,
  totalResenas: p.total_resenas,
});

export function VistaFavoritos() {
  const { avisar } = useSesion();
  const [productos, setProductos] = useState<ProductoResumen[] | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    pedir<ProductoApi[]>("/favoritos", { auth: true })
      .then((lista) => vigente && setProductos(lista.map(aResumen)))
      // Sin esto un fallo de red se vería como "Aún no tienes favoritos".
      .catch((e) => vigente && setError(e instanceof Error ? e.message : "No se pudieron cargar tus favoritos."));
    return () => {
      vigente = false;
    };
  }, [intento]);

  const quitar = async (p: ProductoResumen) => {
    setProductos((lista) => lista?.filter((x) => x.id !== p.id) ?? null); // se ve al instante
    try {
      await pedir(`/favoritos/${p.id}`, { method: "DELETE", auth: true });
      avisar("info", "Quitado de tus favoritos");
    } catch (e) {
      setProductos((lista) => (lista ? [p, ...lista] : lista));
      avisar("error", e instanceof Error ? e.message : "No se pudo quitar");
    }
  };

  return (
    <>
      <h2 className="mb-4 font-display text-3xl text-plum">Mis favoritos</h2>

      {error ? (
        <div role="alert" className="flex flex-col items-start gap-3 border-t border-plum/10 py-6">
          <h3 className="text-lg font-semibold text-plum">No pudimos cargar tus favoritos</h3>
          <p className="max-w-sm text-sm text-plum-soft">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setIntento((n) => n + 1);
            }}
            className="btn btn-primary px-6!"
          >
            Reintentar
          </button>
        </div>
      ) : !productos ? (
        <div role="status" aria-label="Cargando favoritos" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} aria-hidden="true" className="skeleton aspect-4/5 rounded-md" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="flex animate-fade-in flex-col items-start gap-3 border-t border-plum/10 py-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-plum/15 text-plum">
            <IconoCorazon size={22} />
          </span>
          <h3 className="font-display text-2xl text-plum">Aún no tienes favoritos</h3>
          <p className="max-w-sm text-sm text-plum-soft">Toca el corazón en un producto para guardarlo aquí y encontrarlo después.</p>
          <Link href="/tienda" className="btn btn-primary mt-2 px-6!">
            Explorar tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {productos.map((p, i) => (
            <div key={p.id} className="relative">
              <TarjetaProducto producto={p} indice={i} />
              <button
                type="button"
                onClick={() => quitar(p)}
                aria-label={`Quitar ${p.nombre} de favoritos`}
                className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-berry shadow-[0_2px_8px_-2px_rgb(0_0_0/0.25)] transition hover:scale-105"
              >
                <IconoCorazon size={18} relleno />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
