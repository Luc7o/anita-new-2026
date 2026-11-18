import { useEffect, useState } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

// true si la persona pidió menos movimiento en su sistema. Las animaciones por
// CSS ya se apagan solas (regla global en theme.css); este hook sirve para las
// que se hacen con JavaScript (contadores, transición entre secciones).
export default function useReducirMovimiento() {
  const [reducir, setReducir] = useState(() => window.matchMedia?.(CONSULTA).matches ?? false);

  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA);
    if (!mq) return undefined;
    const alCambiar = () => setReducir(mq.matches);
    mq.addEventListener?.("change", alCambiar);
    return () => mq.removeEventListener?.("change", alCambiar);
  }, []);

  return reducir;
}
