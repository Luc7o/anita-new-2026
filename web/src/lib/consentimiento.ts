// Lectura del consentimiento de estadísticas (mismas claves y reglas que
// frontend/src/consentimiento.js). Aquí solo se LEE: la decisión la toma la persona
// en el aviso de privacidad de la tienda. Sin consentimiento vigente no hay analítica.
const CLAVE_CONSENTIMIENTO = "ans_consentimiento";
const CLAVE_SESION_ANALITICA = "ans_sesion_analitica";
const VERSION_CONSENTIMIENTO = "2026-11"; // = frontend/src/legal.js
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

export function obtenerSesionAnalitica(): string | null {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO) || "null");
    const vigente =
      d && d.analitica === true && d.version === VERSION_CONSENTIMIENTO &&
      Date.now() - Date.parse(d.decidido_en) <= VIGENCIA_MS;
    return vigente ? localStorage.getItem(CLAVE_SESION_ANALITICA) : null;
  } catch {
    return null;
  }
}
