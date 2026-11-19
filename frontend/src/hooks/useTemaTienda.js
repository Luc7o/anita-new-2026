import { useCallback, useEffect, useState } from "react";

// Modo claro/oscuro de la TIENDA (el panel admin tiene el suyo: useTemaAdmin).
// Se guarda "light", "dark" o "system" (seguir al sistema). La clase "dark" de <html> la
// pone primero el script de index.html (antes de pintar, así no hay parpadeo) y después
// este hook y el ThemeToggler de Animate UI.
export const CLAVE_TEMA = "anita-tema";
const CONSULTA = "(prefers-color-scheme: dark)";
const EVENTO = "anita-tema-cambio";

function leerGuardado() {
  try {
    const valor = localStorage.getItem(CLAVE_TEMA);
    if (valor === "light" || valor === "dark" || valor === "system") return valor;
  } catch {
    /* sin acceso a localStorage: se sigue al sistema */
  }
  return "system";
}

function sistemaEsOscuro() {
  return typeof window !== "undefined" && !!window.matchMedia?.(CONSULTA).matches;
}

export default function useTemaTienda() {
  const [tema, setTemaEstado] = useState(leerGuardado);
  const [sistemaOscuro, setSistemaOscuro] = useState(sistemaEsOscuro);

  // Si la persona eligió "seguir al sistema", el cambio del sistema se refleja al momento.
  useEffect(() => {
    const mq = window.matchMedia?.(CONSULTA);
    if (!mq) return undefined;
    const alCambiar = (e) => setSistemaOscuro(e.matches);
    mq.addEventListener?.("change", alCambiar);
    return () => mq.removeEventListener?.("change", alCambiar);
  }, []);

  // Varios botones (barra y menú del celular) y otras pestañas comparten el mismo tema.
  useEffect(() => {
    const sincronizar = () => setTemaEstado(leerGuardado());
    const alGuardar = (e) => {
      if (e.key === CLAVE_TEMA) sincronizar();
    };
    window.addEventListener(EVENTO, sincronizar);
    window.addEventListener("storage", alGuardar);
    return () => {
      window.removeEventListener(EVENTO, sincronizar);
      window.removeEventListener("storage", alGuardar);
    };
  }, []);

  const resuelto = tema === "system" ? (sistemaOscuro ? "dark" : "light") : tema;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resuelto === "dark");
  }, [resuelto]);

  const setTema = useCallback((nuevo) => {
    setTemaEstado(nuevo);
    try {
      localStorage.setItem(CLAVE_TEMA, nuevo);
    } catch {
      /* ignorar: el tema igual cambia en esta visita */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);

  return { tema, resuelto, setTema };
}
