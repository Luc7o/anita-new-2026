"use client";

import { useState } from "react";
import { URL_API } from "@/lib/sitio";
import { guardarLineas, leerLineas, mismaLinea } from "@/lib/carritoInvitado";

type Variante = { talla: string | null; color: string | null; colorHex: string | null; stock: number };

export function Comprar({ productoId, tallas, colores, variantes, sinStock }: {
  productoId: number;
  tallas: string[];
  colores: string[];
  variantes: Variante[];
  sinStock: boolean;
}) {
  const [talla, setTalla] = useState<string | null>(tallas.length === 1 ? tallas[0]! : null);
  const [color, setColor] = useState<string | null>(colores.length === 1 ? colores[0]! : null);
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const faltaElegir = (tallas.length > 0 && !talla) || (colores.length > 0 && !color);
  const hayStock = (t: string | null, c: string | null) =>
    variantes.length === 0 ||
    variantes.some((v) => (t === null || v.talla === t) && (c === null || v.color === c) && v.stock > 0);

  async function agregar(irAlCheckout: boolean) {
    setError("");
    if (faltaElegir) {
      setError(tallas.length && !talla ? "Elige una talla" : "Elige un color");
      return;
    }
    setEnviando(true);
    // Carrito de invitado en el navegador; al tener sesión se fusiona con la cuenta.
    const lineas = leerLineas();
    const igual = lineas.find((l) => mismaLinea(l, { producto_id: productoId, talla, color }));
    const key = igual?.key ?? crypto.randomUUID();
    const candidatas = igual
      ? lineas.map((l) => (l === igual ? { ...l, cantidad: l.cantidad + cantidad } : l))
      : [...lineas, { key, producto_id: productoId, cantidad, talla, color }];
    try {
      // El servidor confirma stock y opciones antes de guardar nada.
      const r = await fetch(`${URL_API}/carrito/invitado/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: candidatas }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error ?? "No se pudo agregar al carrito");
      const mia = (datos.items as { id: string; problema: string | null }[]).find((i) => i.id === key);
      if (mia?.problema) {
        throw new Error(igual ? `Ya tienes ${igual.cantidad} en tu carrito. ${mia.problema}` : mia.problema);
      }
      guardarLineas(candidatas);
      window.location.href = irAlCheckout ? "/checkout" : "/carrito";
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar al carrito");
      setEnviando(false);
    }
  }

  if (sinStock) {
    return <p className="rounded-xl bg-plum/5 px-4 py-3 text-center font-bold text-plum-soft">Agotado por ahora</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {tallas.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Talla</legend>
          <div className="flex flex-wrap gap-2">
            {tallas.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={talla === t}
                disabled={!hayStock(t, color)}
                onClick={() => setTalla(t)}
                className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                  talla === t ? "border-plum bg-plum text-ivory" : "border-plum/20 hover:border-plum"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {colores.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Color{color ? `: ${color}` : ""}</legend>
          <div className="flex flex-wrap gap-2">
            {colores.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={color === c}
                disabled={!hayStock(talla, c)}
                onClick={() => setColor(c)}
                className={`h-11 w-11 rounded-full border-2 disabled:cursor-not-allowed disabled:opacity-30 ${
                  color === c ? "border-plum ring-2 ring-plum ring-offset-2 ring-offset-ivory" : "border-plum/15"
                }`}
                style={{ backgroundColor: variantes.find((v) => v.color === c)?.colorHex ?? "#ccc" }}
              />
            ))}
          </div>
        </fieldset>
      )}

      <div role="group" aria-label="Cantidad" className="flex items-center gap-3">
        <span className="text-sm font-semibold">Cantidad</span>
        <button type="button" aria-label="Restar una unidad" onClick={() => setCantidad((n) => Math.max(1, n - 1))} className="h-11 w-11 rounded-xl border border-plum/20 text-lg">
          −
        </button>
        <span className="w-6 text-center font-bold tabular-nums">{cantidad}</span>
        <button type="button" aria-label="Sumar una unidad" onClick={() => setCantidad((n) => Math.min(99, n + 1))} className="h-11 w-11 rounded-xl border border-plum/20 text-lg">
          +
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => agregar(false)} disabled={enviando} className="btn-primary min-h-13 flex-1 text-base">
          {enviando ? "Agregando…" : "Agregar al carrito"}
        </button>
        <button
          type="button"
          onClick={() => agregar(true)}
          disabled={enviando}
          className="min-h-13 flex-1 rounded-xl border-2 border-plum font-bold transition-colors hover:bg-plum hover:text-ivory disabled:opacity-50"
        >
          Comprar ahora
        </button>
      </div>
      <p role="alert" className="min-h-5 text-sm font-semibold text-peligro">
        {error}
      </p>
    </div>
  );
}
