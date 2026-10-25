import { lazy } from "react";

// Igual que React.lazy, pero si la página no se puede descargar la recarga
// una vez. Pasa justo después de un despliegue nuevo: una pestaña que quedó
// abierta con la versión anterior pide archivos con nombre viejo, que ya no
// existen (el servidor responde con HTML y el navegador marca error de MIME).
// Recargar trae la versión nueva. Si ya se recargó hace poco y sigue
// fallando, el error se propaga para no entrar en un bucle de recargas.
const CLAVE = "recarga_por_version_nueva";
const VENTANA_MS = 15000;

// Pide el módulo; si falla por versión vieja, recarga una sola vez.
export function importarConReintento(importador) {
  return importador().catch((error) => {
    let yaRecargo = true; // sin sessionStorage no se puede proteger del bucle: no recargamos
    try {
      const ultima = Number(sessionStorage.getItem(CLAVE) || 0);
      yaRecargo = Date.now() - ultima < VENTANA_MS;
      if (!yaRecargo) sessionStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      yaRecargo = true;
    }
    if (!yaRecargo) {
      window.location.reload();
      return new Promise(() => {}); // la página se está recargando
    }
    throw error;
  });
}

export function lazyConReintento(importador) {
  return lazy(() => importarConReintento(importador));
}
