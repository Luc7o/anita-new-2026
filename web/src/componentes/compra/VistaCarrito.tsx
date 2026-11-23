"use client";

import Link from "next/link";
import { useState } from "react";
import { soles } from "@/lib/precio";
import { COSTO_DELIVERY } from "@/lib/tienda";
import { Foto } from "../Foto";
import { IconoCarrito, IconoFlecha } from "../Iconos";
import { useCompra } from "./Compra";

// Carrito "a detalle": foto, precio unitario, cantidades y resumen antes de pagar.
export function VistaCarrito() {
  const { listo, items, total, totalItems, usuario, cambiarCantidad, quitar } = useCompra();
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [ocupados, setOcupados] = useState<Record<string, boolean>>({});

  const conLinea = async (id: string | number, accion: () => Promise<void>) => {
    setErrores((e) => ({ ...e, [id]: null }));
    setOcupados((o) => ({ ...o, [id]: true }));
    try {
      await accion();
    } catch (err) {
      setErrores((e) => ({ ...e, [id]: err instanceof Error ? err.message : "No se pudo actualizar" }));
    } finally {
      setOcupados((o) => ({ ...o, [id]: false }));
    }
  };

  const hayProblemas = items.some((i) => i.problema);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20 sm:px-8">
      <div className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-plum sm:text-5xl">Tu carrito</h1>
        {listo && items.length > 0 && (
          <span className="text-sm text-plum-soft">{totalItems} {totalItems === 1 ? "producto" : "productos"}</span>
        )}
      </div>

      {!listo ? (
        <div role="status" aria-label="Cargando tu carrito" className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-36 rounded-[20px]" />)}
          </div>
          <div className="skeleton h-64 rounded-[20px]" aria-hidden="true" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[20px] bg-white p-12 text-center dark:bg-white/5">
          <IconoCarrito size={32} className="mx-auto text-plum-soft" />
          <p className="mt-4 font-display text-2xl font-bold">Tu carrito está vacío</p>
          <p className="mt-2 text-plum-soft">Mira lo nuevo de la tienda y agrega lo que te guste; aquí lo revisas antes de pagar.</p>
          <Link href="/tienda" className="btn-primary mt-6 inline-flex px-6">Ver lo nuevo</Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
          <ul className="flex flex-col gap-4">
            {items.map((item) => {
              const p = item.producto;
              const conOferta = p.tiene_oferta && p.precio > p.precio_final;
              const ocupado = ocupados[item.id];
              return (
                <li key={item.id} className="flex animate-fade-in-up gap-4 rounded-[20px] bg-white p-4 dark:bg-white/5">
                  <Link href={`/producto/${p.id}`} aria-label={`Ver ${p.nombre}`} className="foto-vacia relative h-32 w-26 shrink-0 overflow-hidden rounded-2xl sm:h-36 sm:w-28">
                    <Foto url={p.imagen_url} alt={p.nombre} sizes="112px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/producto/${p.id}`} className="block font-bold leading-snug hover:text-berry">{p.nombre}</Link>
                        <p className="mt-0.5 text-xs text-plum-soft">{[item.talla && `Talla ${item.talla}`, item.color].filter(Boolean).join(" · ")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => conLinea(item.id, () => quitar(item.id))}
                        disabled={ocupado}
                        aria-label={`Quitar ${p.nombre} del carrito`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-plum-soft transition-colors hover:bg-ivory hover:text-berry disabled:opacity-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                      <span className="font-semibold">{soles(p.precio_final)}</span>
                      {conOferta && <span className="text-xs text-plum-soft line-through">{soles(p.precio)}</span>}
                      <span className="text-xs text-plum-soft">c/u</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center rounded-xl border-[1.5px] border-plum/15">
                        <button type="button" onClick={() => conLinea(item.id, () => cambiarCantidad(item.id, item.cantidad - 1))} disabled={ocupado} aria-label={`Restar una unidad de ${p.nombre}`} className="flex h-11 w-11 items-center justify-center text-lg hover:text-berry disabled:opacity-50">−</button>
                        <span className="w-7 text-center font-bold tabular-nums" aria-live="polite">{item.cantidad}</span>
                        <button type="button" onClick={() => conLinea(item.id, () => cambiarCantidad(item.id, item.cantidad + 1))} disabled={ocupado} aria-label={`Sumar una unidad de ${p.nombre}`} className="flex h-11 w-11 items-center justify-center text-lg hover:text-berry disabled:opacity-50">+</button>
                      </div>
                      <span className="precio text-lg">{soles(item.subtotal)}</span>
                    </div>
                    {item.problema && <p className="mt-2 text-xs text-berry-dark" role="alert">{item.problema}</p>}
                    {errores[item.id] && <p className="mt-2 text-xs text-berry-dark" role="alert">{errores[item.id]}</p>}
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="boleta h-fit space-y-4 md:sticky md:top-28" aria-labelledby="resumen-titulo">
            <h2 id="resumen-titulo" className="font-display text-2xl font-bold">Resumen</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-plum-soft">Subtotal ({totalItems} {totalItems === 1 ? "producto" : "productos"})</dt>
                <dd className="cifra font-semibold">{soles(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-plum-soft">Envío</dt>
                <dd className="text-right text-plum-soft">{soles(COSTO_DELIVERY)} con delivery<br />Gratis con recojo en tienda</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between border-t border-dashed border-plum/30 pt-4">
              <span className="font-extrabold uppercase">Total (sin envío)</span>
              <span className="cifra text-2xl font-semibold">{soles(total)}</span>
            </div>
            {hayProblemas && <p className="text-xs text-berry-dark" role="alert">Algunos productos cambiaron de disponibilidad. Ajusta las cantidades para continuar.</p>}
            {!usuario && !hayProblemas && <p className="text-xs text-plum-soft">No necesitas cuenta para comprar: solo tu correo al finalizar.</p>}
            {hayProblemas ? (
              <button type="button" disabled className="btn-primary min-h-13! w-full cursor-not-allowed opacity-50">Ir a pagar</button>
            ) : (
              <Link href="/checkout" className="btn-primary min-h-13! w-full text-base!">Ir a pagar <IconoFlecha size={18} /></Link>
            )}
            <Link href="/tienda" className="btn-relleno w-full">Seguir comprando</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
