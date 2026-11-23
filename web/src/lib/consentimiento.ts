"use client";

// Consentimiento para las ESTADÍSTICAS DE USO (claves de siempre en el navegador, así se
// conservan las decisiones ya tomadas).
//
//  - ans_consentimiento  : la decisión (aceptó / rechazó), su fecha y la versión del aviso.
//                          Estrictamente necesario: sin él habría que preguntar en cada visita.
//  - ans_sesion_analitica: identificador anónimo de estadísticas. Opcional: solo existe si la
//                          persona acepta, y se borra al rechazar o retirar.
//
// Sin consentimiento no se crea ningún identificador ni se envía ningún evento.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { hayToken, pedir } from "./api";

const CLAVE_CONSENTIMIENTO = "ans_consentimiento";
const CLAVE_SESION_ANALITICA = "ans_sesion_analitica";
export const VERSION_CONSENTIMIENTO = "2026-11"; // = VERSION_CONSENTIMIENTO de backend/app/utils/legal.py
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

export type EstadoConsentimiento = "pendiente" | "aceptado" | "rechazado";
type Decision = { analitica: boolean; version: string; decidido_en: string };
export type ResultadoDecision = { ok: boolean; servidor: boolean };

const oyentes = new Set<() => void>();
const oyentesPanel = new Set<() => void>();
let panelAbierto = false;

function almacen(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null; // acceso bloqueado (modo privado estricto, cookies desactivadas…)
  }
}

const avisarCambio = () => oyentes.forEach((fn) => fn());

export function leerDecision(): Decision | null {
  try {
    const d = JSON.parse(almacen()?.getItem(CLAVE_CONSENTIMIENTO) || "null");
    if (d && typeof d.analitica === "boolean" && typeof d.version === "string" && typeof d.decidido_en === "string") return d;
  } catch {
    // valor dañado: se trata como "sin decisión"
  }
  return null;
}

/** "pendiente" si nunca decidió, si la decisión es de otra versión del aviso o si ya venció. */
export function estadoConsentimiento(ahora = Date.now()): EstadoConsentimiento {
  const d = leerDecision();
  if (!d || d.version !== VERSION_CONSENTIMIENTO) return "pendiente";
  const fecha = Date.parse(d.decidido_en);
  if (Number.isNaN(fecha) || ahora - fecha > VIGENCIA_MS) return "pendiente";
  return d.analitica ? "aceptado" : "rechazado";
}

function leerSesion() {
  try {
    return almacen()?.getItem(CLAVE_SESION_ANALITICA) ?? null;
  } catch {
    return null;
  }
}

/** Elimina el identificador de estadísticas. Devuelve el que había. */
function borrarSesionAnalitica() {
  const anterior = leerSesion();
  try {
    almacen()?.removeItem(CLAVE_SESION_ANALITICA);
  } catch {
    // nada que hacer
  }
  return anterior;
}

/** Identificador de estadísticas, SOLO si hay consentimiento vigente. Si no, null (y no se crea nada). */
export function obtenerSesionAnalitica(): string | null {
  if (estadoConsentimiento() !== "aceptado") {
    borrarSesionAnalitica(); // por si quedó uno de una versión anterior
    return null;
  }
  return leerSesion();
}

function crearSesionAnalitica() {
  const existente = leerSesion();
  if (existente) return existente;
  const nuevo = globalThis.crypto?.randomUUID?.();
  if (!nuevo) return null; // sin generador seguro no se hace seguimiento
  try {
    almacen()?.setItem(CLAVE_SESION_ANALITICA, nuevo);
  } catch {
    return null;
  }
  return leerSesion();
}

function guardarDecision(analitica: boolean) {
  try {
    almacen()?.setItem(
      CLAVE_CONSENTIMIENTO,
      JSON.stringify({ analitica, decidido_en: new Date().toISOString(), version: VERSION_CONSENTIMIENTO })
    );
  } catch {
    // sin almacenamiento: la decisión vale solo en esta visita
  }
  if (!analitica) borrarSesionAnalitica();
  avisarCambio();
}

function suscribir(fn: () => void) {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}

function suscribirPanel(fn: () => void) {
  oyentesPanel.add(fn);
  return () => {
    oyentesPanel.delete(fn);
  };
}

export function abrirPreferencias() {
  panelAbierto = true;
  oyentesPanel.forEach((fn) => fn());
}

export function cerrarPreferencias() {
  panelAbierto = false;
  oyentesPanel.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  // Cambios hechos en otra pestaña también se reflejan aquí.
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === CLAVE_CONSENTIMIENTO || e.key === CLAVE_SESION_ANALITICA) avisarCambio();
  });
  // Al cargar: sin consentimiento vigente no debe quedar ningún identificador.
  if (estadoConsentimiento() !== "aceptado") borrarSesionAnalitica();
}

/**
 * Estado y acciones del consentimiento:
 *  aceptar()  -> crea el identificador, deja constancia en el servidor y recién entonces activa.
 *  rechazar() -> no crea nada. Si antes había aceptado, equivale a retirar.
 *  retirar()  -> detiene y borra el identificador al instante y pide al servidor borrar lo recogido.
 */
export function useConsentimiento() {
  const estado = useSyncExternalStore(suscribir, () => estadoConsentimiento(), () => "pendiente" as const);
  const abierto = useSyncExternalStore(suscribirPanel, () => panelAbierto, () => false);
  // Se relee cuando cambia el estado (la fecha de la decisión acompaña al estado).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const decision = useMemo(() => leerDecision(), [estado]);

  const aceptar = useCallback(async (): Promise<ResultadoDecision> => {
    const sesionId = crearSesionAnalitica();
    if (!sesionId) return { ok: false, servidor: false };
    try {
      await pedir("/consentimiento", { method: "POST", body: { decision: "aceptado", version: VERSION_CONSENTIMIENTO, sesion_id: sesionId } });
    } catch {
      borrarSesionAnalitica(); // sin constancia en el servidor no se activa nada
      return { ok: false, servidor: false };
    }
    guardarDecision(true);
    return { ok: true, servidor: true };
  }, []);

  const retirar = useCallback(async (): Promise<ResultadoDecision> => {
    const sesionId = borrarSesionAnalitica(); // 1) se detiene todo ya
    guardarDecision(false);
    try {
      await pedir("/consentimiento/retirar", { method: "POST", body: { sesion_id: sesionId || undefined }, auth: hayToken() });
      return { ok: true, servidor: true };
    } catch {
      return { ok: true, servidor: false };
    }
  }, []);

  const rechazar = useCallback(async (): Promise<ResultadoDecision> => {
    if (estadoConsentimiento() === "aceptado") return retirar();
    guardarDecision(false);
    try {
      await pedir("/consentimiento", { method: "POST", body: { decision: "rechazado", version: VERSION_CONSENTIMIENTO } });
      return { ok: true, servidor: true };
    } catch {
      return { ok: true, servidor: false };
    }
  }, [retirar]);

  return { estado, decision, panelAbierto: abierto, aceptar, rechazar, retirar, abrirPreferencias, cerrarPreferencias };
}
