"use client";

// Ingreso, registro y recuperación de contraseña contra la API Flask.
// La sesión que abren es una cookie httpOnly de refresh + token CSRF (ver lib/api.ts).
import { guardarSesion, pedir } from "./api";

export type UsuarioSesion = { id: number; nombre: string | null; email: string; rol?: string | null; es_invitado?: boolean };

type RespuestaSesion = { token: string; csrf?: string; usuario: UsuarioSesion };
type RespuestaIngreso = RespuestaSesion | { requiere_2fa: true; token_2fa: string };

/** Sesión abierta, o el pase de 5 minutos para pedir el código de dos pasos. */
export type ResultadoIngreso = { usuario: UsuarioSesion } | { pase2fa: string };

function abrir(datos: RespuestaIngreso): ResultadoIngreso {
  if ("requiere_2fa" in datos) return { pase2fa: datos.token_2fa };
  guardarSesion(datos.token, datos.csrf);
  return { usuario: datos.usuario };
}

export async function ingresar(email: string, password: string) {
  return abrir(await pedir<RespuestaIngreso>("/auth/login", { method: "POST", body: { email, password } }));
}

export async function ingresarConGoogle(credential: string, aceptaTerminos: boolean) {
  return abrir(
    await pedir<RespuestaIngreso>("/auth/google", { method: "POST", body: { credential, acepta_terminos: aceptaTerminos } })
  );
}

export async function verificarSegundoPaso(pase: string, codigo: string, recordarDispositivo: boolean) {
  const datos = await pedir<RespuestaSesion>("/auth/login-2fa", {
    method: "POST",
    body: { token_2fa: pase, codigo, recordar_dispositivo: recordarDispositivo },
  });
  guardarSesion(datos.token, datos.csrf);
  return datos.usuario;
}

/** Cuenta nueva solo con el correo: el backend la crea y devuelve sesión. */
export async function registrarConCorreo(email: string) {
  const datos = await pedir<RespuestaSesion>("/auth/registro-email", {
    method: "POST",
    body: { email, acepta_terminos: true },
  });
  guardarSesion(datos.token, datos.csrf);
  return datos.usuario;
}

export function pedirEnlaceRecuperacion(email: string) {
  return pedir("/auth/olvide-password", { method: "POST", body: { email } });
}

export function restablecerPassword(token: string, passwordNueva: string) {
  return pedir("/auth/restablecer-password", { method: "POST", body: { token, password_nueva: passwordNueva } });
}

/**
 * A dónde ir después de ingresar: ?volver=/ruta (solo rutas internas, igual que la
 * de siempre), o el inicio. Se navega con recarga completa para arrancar con la sesión.
 */
export function destinoTrasIngresar() {
  const volver = new URLSearchParams(window.location.search).get("volver");
  return volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : "/";
}
