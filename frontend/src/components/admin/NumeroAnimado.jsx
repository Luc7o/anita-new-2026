import React, { useEffect, useMemo, useRef, useState } from "react";
import useReducirMovimiento from "../../hooks/useReducirMovimiento.js";

// Reconoce valores como 12, "S/ 18420.00", "45%" o "3.4 h": un prefijo, UN número y un sufijo.
// Si el valor tiene otra forma (varios números, texto), se muestra tal cual, sin animar.
const PATRON = /^(\D*?)(-?\d+(?:\.\d+)?)(\D*)$/;

function analizar(valor) {
  if (typeof valor !== "number" && typeof valor !== "string") return null;
  const m = PATRON.exec(String(valor));
  if (!m) return null;
  const n = Number(m[2]);
  if (!Number.isFinite(n)) return null;
  return { prefijo: m[1], sufijo: m[3], n, decimales: (m[2].split(".")[1] || "").length };
}

const armar = (p, actual) => `${p.prefijo}${actual.toFixed(p.decimales)}${p.sufijo}`;

// Número que cuenta hasta su valor. Al terminar muestra el valor ORIGINAL sin tocar,
// así el formato (soles, %, etc.) es siempre el que ya tenía la pantalla.
// Los lectores de pantalla leen solo el valor final, no los números intermedios.
export default function NumeroAnimado({ valor, duracion = 1400, retraso = 250 }) {
  const reducir = useReducirMovimiento();
  const analizado = useMemo(() => analizar(valor), [valor]);
  const previo = useRef(0);
  const [texto, setTexto] = useState(() => (analizado && !reducir ? armar(analizado, 0) : valor));

  useEffect(() => {
    if (!analizado || reducir) {
      setTexto(valor);
      return undefined;
    }
    const desde = previo.current;
    const inicio = performance.now() + (desde === 0 ? retraso : 0);
    let cuadro;
    const paso = (ahora) => {
      const k = Math.min(1, Math.max(0, (ahora - inicio) / duracion));
      const suave = 1 - (1 - k) ** 4;
      if (k >= 1) {
        previo.current = analizado.n;
        setTexto(valor);
        return;
      }
      setTexto(armar(analizado, desde + (analizado.n - desde) * suave));
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [analizado, valor, reducir, duracion, retraso]);

  if (!analizado || reducir) return <>{valor}</>;
  return (
    <span className="tabular-nums">
      <span aria-hidden="true">{texto}</span>
      <span className="sr-only">{valor}</span>
    </span>
  );
}
