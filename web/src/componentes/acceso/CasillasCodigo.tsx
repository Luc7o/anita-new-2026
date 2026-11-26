"use client";

import { useLayoutEffect, useRef } from "react";

// Código de N dígitos en casillas separadas. Al escribir pasa sola a la siguiente, Borrar
// vuelve a la anterior, las flechas mueven el foco y pegar (o el autocompletado del celular
// con el código) reparte los dígitos en todas las casillas.
//
// Fases (las dibuja globals.css):
// - escribiendo: la casilla activa brilla en rosa.
// - verificando: una luz recorre el borde de cada casilla mientras se comprueba el código.
// - juntando: las casillas se deslizan al centro y se apilan.
// - listo: queda una sola casilla con borde verde y un check que se dibuja.
export type FaseCodigo = "escribiendo" | "verificando" | "juntando" | "listo";

export function CasillasCodigo({ largo = 6, valor, onCambiar, error = false, etiquetaId, autoFocus = false, fase = "escribiendo" }: {
  largo?: number;
  valor: string;
  onCambiar: (v: string) => void;
  error?: boolean;
  /** id del texto que nombra al grupo (aria-labelledby). */
  etiquetaId: string;
  autoFocus?: boolean;
  fase?: FaseCodigo;
}) {
  const grupo = useRef<HTMLDivElement>(null);
  const marcos = useRef<(HTMLSpanElement | null)[]>([]);
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  const digitos = Array.from({ length: largo }, (_, i) => valor[i] ?? "");
  const bloqueado = fase !== "escribiendo";

  // Al juntarse, cada casilla se corre hasta el centro del grupo (y queda un poco girada,
  // como cartas apiladas).
  useLayoutEffect(() => {
    if (fase !== "juntando" || !grupo.current) return;
    const caja = grupo.current.getBoundingClientRect();
    const centro = caja.left + caja.width / 2;
    marcos.current.forEach((m, i) => {
      if (!m) return;
      const r = m.getBoundingClientRect();
      const giro = (i - (largo - 1) / 2) * 3;
      m.style.transform = `translateX(${centro - (r.left + r.width / 2)}px) rotate(${giro}deg)`;
    });
  }, [fase, largo]);

  if (fase === "listo") {
    return (
      <div role="status" aria-label="Código verificado" className="flex justify-center">
        <span className="casilla-verificada">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="trazo-check" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </div>
    );
  }

  const enfocar = (i: number) => casillas.current[Math.max(0, Math.min(largo - 1, i))]?.focus();

  const escribir = (i: number, texto: string) => {
    const nuevos = texto.replace(/\D/g, "");
    if (!nuevos) return;
    const lista = [...digitos];
    for (let k = 0; k < nuevos.length && i + k < largo; k++) lista[i + k] = nuevos.charAt(k);
    onCambiar(lista.join("").slice(0, largo));
    enfocar(i + nuevos.length);
  };

  const alTeclear = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const lista = [...digitos];
      if (lista[i]) lista[i] = "";
      else if (i > 0) {
        lista[i - 1] = "";
        enfocar(i - 1);
      }
      onCambiar(lista.join(""));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      enfocar(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      enfocar(i + 1);
    }
  };

  return (
    <div
      ref={grupo}
      role="group"
      aria-labelledby={etiquetaId}
      aria-busy={fase === "verificando" || undefined}
      data-fase={fase}
      className={`casillas flex justify-center gap-2 sm:gap-2.5 ${error ? "casillas-error" : ""}`}
    >
      {digitos.map((d, i) => (
        <span
          key={i}
          ref={(el) => {
            marcos.current[i] = el;
          }}
          className="casilla-marco"
          // La luz de cada borde arranca un poco después que la anterior.
          style={{ "--retraso": `${i * 70}ms` } as React.CSSProperties}
        >
          <input
            ref={(el) => {
              casillas.current[i] = el;
            }}
            aria-label={`Dígito ${i + 1} de ${largo}`}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && i === 0}
            readOnly={bloqueado}
            value={d}
            data-lleno={d !== ""}
            aria-invalid={error || undefined}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              if (bloqueado) return;
              // Si la casilla ya tenía un dígito, se queda el recién escrito (esté antes o después).
              const v = e.target.value;
              escribir(i, d && v.length === 2 ? v.replace(d, "") : v);
            }}
            onKeyDown={(e) => !bloqueado && alTeclear(i, e)}
            onPaste={(e) => {
              e.preventDefault();
              if (!bloqueado) escribir(i, e.clipboardData.getData("text"));
            }}
            className="casilla-codigo"
          />
        </span>
      ))}
    </div>
  );
}
