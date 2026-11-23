"use client";

// Cliente de la API Flask para las páginas con sesión (carrito, checkout, cuenta).
// Sigue EXACTAMENTE las reglas de frontend/src/api/client.js, porque las dos apps
// comparten dominio y sesión mientras dure la migración:
// - El access token vive solo en memoria (se pierde al recargar a propósito).
// - Se recupera con /auth/refrescar-token: el navegador manda la cookie httpOnly de
//   refresh y nosotros el token CSRF (cookie legible o, si no, localStorage), con la
//   MISMA clave que la SPA, así una sesión abierta en una app vale en la otra.
import { URL_API } from "./sitio";
import { obtenerSesionAnalitica } from "./consentimiento";

const CLAVE_CSRF = "ans_csrf_refresh";
let accessToken: string | null = null;
let refrescoEnCurso: Promise<string> | null = null;

export class ErrorApi extends Error {
  status: number;
  data: unknown;
  constructor(mensaje: string, status: number, data: unknown) {
    super(mensaje);
    this.status = status;
    this.data = data;
  }
}

export function hayToken() {
  return accessToken !== null;
}

export function guardarSesion(token: string, csrf?: string | null) {
  accessToken = token;
  if (csrf) {
    try {
      localStorage.setItem(CLAVE_CSRF, csrf);
    } catch {
      // localStorage bloqueado: se sigue con la cookie
    }
  }
}

function leerCsrf() {
  const m = document.cookie.match(/(?:^|; )csrf_refresh_token=([^;]*)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  try {
    return localStorage.getItem(CLAVE_CSRF) || "";
  } catch {
    return "";
  }
}

async function refrescar(): Promise<string> {
  if (refrescoEnCurso) return refrescoEnCurso;
  refrescoEnCurso = (async () => {
    const csrf = leerCsrf();
    if (!csrf) throw new Error("No hay sesión que refrescar");
    const r = await fetch(`${URL_API}/auth/refrescar-token`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrf },
    });
    if (!r.ok) throw new Error("La sesión expiró");
    const datos = await r.json();
    guardarSesion(datos.token, datos.csrf);
    return datos.token as string;
  })();
  try {
    return await refrescoEnCurso;
  } finally {
    refrescoEnCurso = null;
  }
}

/** Intenta recuperar la sesión al cargar la página. true si hay sesión. */
export async function recuperarSesion() {
  try {
    await refrescar();
    return true;
  } catch {
    accessToken = null;
    return false;
  }
}

type Opciones = { method?: string; body?: unknown; auth?: boolean };

/**
 * fetch a la API con la sesión: si falta el token lo recupera, y si el servidor dice
 * que venció, lo refresca y reintenta UNA vez. Devuelve la respuesta tal cual.
 */
async function fetchConSesion(ruta: string, { method = "GET", body, auth = false }: Opciones = {}) {
  const init = (token: string | null): RequestInit => ({
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let intentoRefresco = false;
  if (auth && !accessToken) {
    intentoRefresco = true;
    await refrescar().catch(() => undefined);
  }
  let r = await fetch(`${URL_API}${ruta}`, init(accessToken));

  if (auth && r.status === 401) {
    const codigo = ((await r.clone().json().catch(() => null)) as { code?: string } | null)?.code;
    if (codigo === "token_expirado" || (codigo === "token_faltante" && !intentoRefresco)) {
      try {
        r = await fetch(`${URL_API}${ruta}`, init(await refrescar()));
      } catch {
        accessToken = null;
      }
    }
  }
  return r;
}

export async function pedir<T = unknown>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const r = await fetchConSesion(ruta, opciones);
  const datos = await r.json().catch(() => null);
  if (!r.ok) {
    const mensaje = (datos as { error?: string } | null)?.error || "Ocurrió un error, intenta de nuevo.";
    throw new ErrorApi(mensaje, r.status, datos);
  }
  return datos as T;
}

/** Descarga un archivo de la API con la sesión (p. ej. la boleta en PDF). */
export async function descargarArchivo(ruta: string, nombreArchivo: string) {
  const r = await fetchConSesion(ruta, { auth: true });
  if (!r.ok) {
    const datos = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new ErrorApi(datos?.error || "No se pudo descargar el archivo", r.status, datos);
  }
  guardarComoArchivo(nombreArchivo, await r.blob());
}

/** Ofrece un contenido para guardar como archivo en el equipo. */
export function guardarComoArchivo(nombre: string, contenido: Blob) {
  const url = URL.createObjectURL(contenido);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Cierra la sesión en el servidor (borra la cookie de refresh) y en este navegador. */
export async function cerrarSesion() {
  const csrf = leerCsrf();
  accessToken = null;
  try {
    localStorage.removeItem(CLAVE_CSRF);
  } catch {
    // sin localStorage no hay nada que limpiar
  }
  await fetch(`${URL_API}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRF-Token": csrf },
  }).catch(() => undefined);
}

/** Evento de analítica, SOLO si la persona aceptó estadísticas (mismo criterio que la SPA). */
export function registrarEvento(tipoEvento: string, metadata?: Record<string, unknown>) {
  const sesionId = obtenerSesionAnalitica();
  if (!sesionId) return;
  fetch(`${URL_API}/eventos`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify({ tipo_evento: tipoEvento, sesion_id: sesionId, producto_id: null, metadata: metadata ?? null }),
  }).catch(() => undefined);
}
