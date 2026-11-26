"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Filtro de precio: una barra con dos tiradores (mínimo y máximo) que se arrastran de
// izquierda a derecha. Son dos <input type="range"> superpuestos: se manejan también con las
// flechas del teclado y los lectores de pantalla los anuncian. Al soltar un tirador (o un
// momento después de usar las flechas) la tienda se filtra sola.
export function BarraPrecio({ min, max, desde, hasta, parametros }: {
  /** Precio más bajo y más alto de lo que se está mirando (soles enteros). */
  min: number;
  max: number;
  /** Rango elegido ahora (si no hay, toda la barra). */
  desde?: number;
  hasta?: number;
  /** El resto de la dirección (categoría, colores, orden…) sin precio ni página. */
  parametros: string;
}) {
  const router = useRouter();
  const [bajo, setBajo] = useState(() => Math.max(min, Math.min(desde ?? min, max)));
  const [alto, setAlto] = useState(() => Math.min(max, Math.max(hasta ?? max, min)));
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Si cambia la categoría (y con ella el rango), la barra se acomoda.
  useEffect(() => {
    setBajo(Math.max(min, Math.min(desde ?? min, max)));
    setAlto(Math.min(max, Math.max(hasta ?? max, min)));
  }, [min, max, desde, hasta]);

  useEffect(() => () => clearTimeout(espera.current), []);

  const aplicar = (b: number, a: number, demora = 0) => {
    clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      const u = new URLSearchParams(parametros);
      if (b > min) u.set("precio_min", String(b));
      if (a < max) u.set("precio_max", String(a));
      const texto = u.toString();
      router.push(texto ? `/tienda?${texto}` : "/tienda", { scroll: false });
    }, demora);
  };

  const tramo = Math.max(1, max - min);
  const izquierda = ((bajo - min) / tramo) * 100;
  const derecha = 100 - ((alto - min) / tramo) * 100;

  // Al soltar se aplica enseguida; con las flechas, un momento después de la última.
  const alSoltar = () => aplicar(bajo, alto);
  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) aplicar(bajo, alto, 600);
  };

  return (
    <div className="w-72 max-w-full px-3 pb-3 pt-2">
      <p className="flex items-baseline justify-between font-semibold text-plum" aria-live="polite">
        <span>S/ {bajo}</span>
        <span className="text-xs font-normal text-plum-soft">a</span>
        <span>S/ {alto}</span>
      </p>

      <div className="barra-precio relative mt-4 h-6">
        {/* Riel y tramo elegido */}
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-plum/12" />
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-plum"
          style={{ left: `${izquierda}%`, right: `${derecha}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={bajo}
          aria-label="Precio mínimo"
          aria-valuetext={`S/ ${bajo}`}
          onChange={(e) => setBajo(Math.min(Number(e.target.value), alto))}
          onPointerUp={alSoltar}
          onKeyUp={alTeclear}
          // El de la izquierda queda arriba cuando los dos tiradores se juntan al final.
          className={bajo > max - (max - min) * 0.1 ? "z-20" : "z-10"}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={alto}
          aria-label="Precio máximo"
          aria-valuetext={`S/ ${alto}`}
          onChange={(e) => setAlto(Math.max(Number(e.target.value), bajo))}
          onPointerUp={alSoltar}
          onKeyUp={alTeclear}
          className="z-10"
        />
      </div>

      <p className="mt-1 flex justify-between text-xs text-plum-soft">
        <span>S/ {min}</span>
        <span>S/ {max}</span>
      </p>
    </div>
  );
}
