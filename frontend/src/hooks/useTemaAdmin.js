import { useCallback, useEffect, useState } from "react";

const CLAVE = "anita-admin-tema";

// Tema inicial: lo que eligió la persona la última vez; si nunca eligió, el del sistema.
function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "oscuro" || guardado === "claro") return guardado;
  } catch {
    /* sin acceso a localStorage: se usa el del sistema */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

// Modo claro/oscuro del panel de administración. Pone clases en <html> (así también
// lo heredan los diálogos) y las quita al salir del panel, para no tocar la tienda.
export default function useTemaAdmin() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("admin-mode");
    return () => html.classList.remove("admin-mode", "admin-dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("admin-dark", tema === "oscuro");
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* ignorar */
    }
  }, [tema]);

  const alternar = useCallback(() => setTema((t) => (t === "oscuro" ? "claro" : "oscuro")), []);
  return { tema, alternar };
}
