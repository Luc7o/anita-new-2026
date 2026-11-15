// Consentimiento para las ESTADÍSTICAS DE USO (analítica propia de la tienda).
//
// Qué se guarda en el navegador y por qué:
//  - ans_consentimiento  : la decisión de la persona (aceptó / rechazó), su fecha y la versión del
//                          aviso que vio. Es ESTRICTAMENTE NECESARIO: es el propio registro de su
//                          elección, sin él habría que preguntarle en cada visita.
//  - ans_sesion_analitica: identificador anónimo de estadísticas. Es OPCIONAL: solo se crea si la
//                          persona acepta expresamente, y se borra al rechazar o retirar.
//
// Sin consentimiento no se crea ningún identificador ni se envía ningún evento. La tienda (cuenta,
// carrito, pedidos y pagos) no depende de nada de esto.
//
// Este módulo no hace peticiones de red (así lo puede importar api/client.js sin ciclos): guardar
// la decisión en el servidor lo hace hooks/useConsentimiento.js.
import { VERSION_CONSENTIMIENTO } from "./legal.js";

export const CLAVE_CONSENTIMIENTO = "ans_consentimiento";
export const CLAVE_SESION_ANALITICA = "ans_sesion_analitica";
// Pasado este tiempo se vuelve a preguntar (la decisión no vale para siempre).
export const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

const oyentes = new Set();
const oyentesPanel = new Set();
let panelAbierto = false;

function almacen() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null; // acceso bloqueado (modo privado estricto, cookies desactivadas…)
  }
}

function avisar() {
  oyentes.forEach((fn) => fn());
}

/** Decisión guardada tal cual, o null si no hay (o está dañada). */
export function leerDecision() {
  const ls = almacen();
  if (!ls) return null;
  try {
    const d = JSON.parse(ls.getItem(CLAVE_CONSENTIMIENTO) || "null");
    if (d && typeof d.analitica === "boolean" && typeof d.version === "string" && typeof d.decidido_en === "string") {
      return d;
    }
  } catch {
    /* valor dañado: se trata como "sin decisión" */
  }
  return null;
}

/**
 * "pendiente" (hay que preguntar) | "aceptado" | "rechazado".
 * Es "pendiente" si nunca decidió, si la decisión es de otra versión del aviso o si ya venció.
 * Devuelve un string a propósito: es estable para useSyncExternalStore.
 */
export function estadoConsentimiento(ahora = Date.now()) {
  const d = leerDecision();
  if (!d || d.version !== VERSION_CONSENTIMIENTO) return "pendiente";
  const fecha = Date.parse(d.decidido_en);
  if (Number.isNaN(fecha) || ahora - fecha > VIGENCIA_MS) return "pendiente";
  return d.analitica ? "aceptado" : "rechazado";
}

export function analiticaPermitida() {
  return estadoConsentimiento() === "aceptado";
}

function leerSesion() {
  const ls = almacen();
  try {
    return ls ? ls.getItem(CLAVE_SESION_ANALITICA) : null;
  } catch {
    return null;
  }
}

/** Elimina el identificador de estadísticas de este navegador. Devuelve el que había. */
export function borrarSesionAnalitica() {
  const ls = almacen();
  const anterior = leerSesion();
  try {
    ls?.removeItem(CLAVE_SESION_ANALITICA);
  } catch {
    /* nada que hacer */
  }
  return anterior;
}

/** Identificador de estadísticas actual, SOLO si hay consentimiento. Si no, null (y no se crea nada). */
export function obtenerSesionAnalitica() {
  if (!analiticaPermitida()) {
    borrarSesionAnalitica(); // por si quedó uno de una versión anterior de la tienda
    return null;
  }
  return leerSesion();
}

function generarId() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = c.getRandomValues(new Uint8Array(16));
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  }
  return null; // sin generador seguro no se hace seguimiento
}

/**
 * Crea (o reutiliza) el identificador. Solo debe llamarse en el momento en que la persona
 * ACEPTA (hooks/useConsentimiento.js); en ningún otro sitio se genera.
 */
export function crearSesionAnalitica() {
  const existente = leerSesion();
  if (existente) return existente;
  const nuevo = generarId();
  if (!nuevo) return null;
  try {
    almacen()?.setItem(CLAVE_SESION_ANALITICA, nuevo);
  } catch {
    return null;
  }
  return leerSesion();
}

/** Guarda la decisión (con fecha y versión). Al rechazar se borra además el identificador. */
export function guardarDecision(analitica) {
  const ls = almacen();
  if (ls) {
    try {
      ls.setItem(
        CLAVE_CONSENTIMIENTO,
        JSON.stringify({ analitica: analitica === true, decidido_en: new Date().toISOString(), version: VERSION_CONSENTIMIENTO })
      );
    } catch {
      /* sin almacenamiento: la decisión vale solo en esta visita */
    }
  }
  if (analitica !== true) borrarSesionAnalitica();
  avisar();
}

// --- Suscripción (para que los componentes reaccionen a cambios, también entre pestañas) ---
export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === CLAVE_CONSENTIMIENTO || e.key === CLAVE_SESION_ANALITICA) avisar();
  });
}

// --- Panel de preferencias (lo abre el pie de página, Configuración o el botón "Configurar") ---
export function panelPreferenciasAbierto() {
  return panelAbierto;
}
export function abrirPreferencias() {
  panelAbierto = true;
  oyentesPanel.forEach((fn) => fn());
}
export function cerrarPreferencias() {
  panelAbierto = false;
  oyentesPanel.forEach((fn) => fn());
}
export function suscribirPanel(fn) {
  oyentesPanel.add(fn);
  return () => oyentesPanel.delete(fn);
}

// Al cargar la tienda: si NO hay consentimiento vigente, no debe quedar ningún identificador de
// estadísticas (por ejemplo, uno creado por una versión anterior de la tienda, que lo hacía sin preguntar).
if (estadoConsentimiento() !== "aceptado") borrarSesionAnalitica();
