"use client";

import { useRef } from "react";

// Código de N dígitos en casillas separadas. Al escribir pasa sola a la siguiente, Borrar
// vuelve a la anterior, las flechas mueven el foco y pegar (o el autocompletado del celular
// con el código) reparte los dígitos en todas las casillas.
export function CasillasCodigo({ largo = 6, valor, onCambiar, error = false, etiquetaId, autoFocus = false, deshabilitado = false }: {
  largo?: number;
  valor: string;
  onCambiar: (v: string) => void;
  error?: boolean;
  /** id del texto que nombra al grupo (aria-labelledby). */
  etiquetaId: string;
  autoFocus?: boolean;
  deshabilitado?: boolean;
}) {
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  const digitos = Array.from({ length: largo }, (_, i) => valor[i] ?? "");

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
    <div role="group" aria-labelledby={etiquetaId} className={`flex justify-center gap-2 sm:gap-2.5 ${error ? "casillas-error" : ""}`}>
      {digitos.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            casillas.current[i] = el;
          }}
          aria-label={`Dígito ${i + 1} de ${largo}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          disabled={deshabilitado}
          value={d}
          data-lleno={d !== ""}
          aria-invalid={error || undefined}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            // Si la casilla ya tenía un dígito, se queda el recién escrito (esté antes o después).
            const v = e.target.value;
            escribir(i, d && v.length === 2 ? v.replace(d, "") : v);
          }}
          onKeyDown={(e) => alTeclear(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            escribir(i, e.clipboardData.getData("text"));
          }}
          className="casilla-codigo"
        />
      ))}
    </div>
  );
}
