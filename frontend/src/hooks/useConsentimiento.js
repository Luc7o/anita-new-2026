import { useSyncExternalStore, useCallback, useMemo } from "react";
import { api } from "../api/client.js";
import { VERSION_CONSENTIMIENTO } from "../legal.js";
import {
  estadoConsentimiento,
  leerDecision,
  suscribir,
  suscribirPanel,
  panelPreferenciasAbierto,
  crearSesionAnalitica,
  borrarSesionAnalitica,
  guardarDecision,
  abrirPreferencias,
  cerrarPreferencias,
} from "../consentimiento.js";

/**
 * Estado y acciones del consentimiento de estadísticas.
 *
 *  aceptar()  -> crea el identificador anónimo, deja constancia en el servidor y recién entonces
 *                activa las estadísticas. Si el servidor no responde, NO se activa nada.
 *  rechazar() -> no se crea ni se guarda ningún identificador. Si antes había aceptado, equivale a retirar.
 *  retirar()  -> detiene el seguimiento y borra el identificador AL INSTANTE (en este navegador) y pide
 *                al servidor borrar lo recogido con él.
 *
 * Todas devuelven { ok, servidor }: `ok` es si la decisión quedó aplicada en este navegador y
 * `servidor` si el servidor pudo registrarla/borrar (el rechazo y el retiro valen igual si falla).
 */
export function useConsentimiento() {
  const estado = useSyncExternalStore(suscribir, estadoConsentimiento, () => "pendiente");
  const panelAbierto = useSyncExternalStore(suscribirPanel, panelPreferenciasAbierto, () => false);
  const decision = useMemo(() => leerDecision(), [estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const aceptar = useCallback(async () => {
    const sesionId = crearSesionAnalitica();
    if (!sesionId) return { ok: false, servidor: false };
    try {
      await api.registrarConsentimiento({ decision: "aceptado", version: VERSION_CONSENTIMIENTO, sesion_id: sesionId });
    } catch (err) {
      borrarSesionAnalitica(); // sin constancia en el servidor no se activa nada
      return { ok: false, servidor: false, error: err };
    }
    guardarDecision(true);
    return { ok: true, servidor: true };
  }, []);

  const retirar = useCallback(async () => {
    const sesionId = borrarSesionAnalitica(); // 1) se detiene todo ya, en este navegador
    guardarDecision(false);
    try {
      await api.retirarConsentimiento({ sesion_id: sesionId || undefined }); // 2) y se borra lo recogido
      return { ok: true, servidor: true };
    } catch {
      return { ok: true, servidor: false };
    }
  }, []);

  const rechazar = useCallback(async () => {
    if (estadoConsentimiento() === "aceptado") return retirar();
    guardarDecision(false);
    try {
      await api.registrarConsentimiento({ decision: "rechazado", version: VERSION_CONSENTIMIENTO });
      return { ok: true, servidor: true };
    } catch {
      return { ok: true, servidor: false };
    }
  }, [retirar]);

  return { estado, decision, panelAbierto, aceptar, rechazar, retirar, abrirPreferencias, cerrarPreferencias };
}
