import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Dialog from "./Dialog.jsx";
import { useConsentimiento } from "../hooks/useConsentimiento.js";
import { useToast } from "../context/ToastContext.jsx";

// Los dos botones de decisión pesan IGUAL (mismo tamaño y énfasis): rechazar es tan fácil como aceptar.
const botonDecision = "rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60";
const botonAceptar = `${botonDecision} bg-berry hover:bg-berry-dark`;
const botonRechazar = `${botonDecision} bg-plum hover:bg-plum/90`;
const botonSecundario =
  "rounded-full border border-plum/30 px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-plum/5 disabled:opacity-60";

/**
 * Aviso de privacidad para las estadísticas de uso. Se muestra hasta que la persona decide, y se
 * puede reabrir en cualquier momento desde el pie de página o Mi cuenta > Configuración.
 * Ninguna opción de seguimiento viene activada. La tienda funciona igual con cualquiera de las dos.
 */
export default function BannerPrivacidad() {
  const location = useLocation();
  const toast = useToast();
  const { estado, panelAbierto, aceptar, rechazar, abrirPreferencias } = useConsentimiento();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  // El panel de administración no mide visitas ni usa este aviso.
  if (location.pathname.startsWith("/admin")) return null;

  const decidir = async (accion, mensajeOk) => {
    setProcesando(true);
    setError("");
    const r = await accion();
    setProcesando(false);
    if (!r.ok) {
      setError("No pudimos guardar tu elección. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    toast.success(mensajeOk);
  };

  return (
    <>
      {estado === "pendiente" && !panelAbierto && (
        <section
          role="region"
          aria-labelledby="aviso-privacidad-titulo"
          className="glass-strong fixed inset-x-3 bottom-3 z-50 rounded-2xl p-4 shadow-glass-lg sm:left-4 sm:right-auto sm:max-w-md"
        >
          <h2 id="aviso-privacidad-titulo" className="text-base font-semibold text-plum">Tu privacidad y cookies</h2>
          <p className="mt-1 text-xs leading-relaxed text-plum-soft">
            Usamos cookies y almacenamiento esencial para que la tienda funcione (tu sesión, carrito, pedidos y pagos). Con tu
            permiso, también medimos cómo se usa la tienda —páginas y productos vistos, carrito y compra— con un
            identificador anónimo, solo para mejorarla. Sin publicidad ni terceros. Puedes cambiar tu elección cuando
            quieras.{" "}
            <Link to="/politica-de-privacidad" className="font-semibold text-berry hover:underline">Más información</Link>
          </p>
          {error && <p className="mt-2 text-xs text-berry-dark" role="alert">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={procesando} onClick={() => decidir(rechazar, "Elegiste no compartir estadísticas")} className={botonRechazar}>
              Rechazar
            </button>
            <button type="button" disabled={procesando} onClick={() => decidir(aceptar, "Gracias, activamos las estadísticas")} className={botonAceptar}>
              Aceptar estadísticas
            </button>
            <button type="button" disabled={procesando} onClick={abrirPreferencias} className={botonSecundario}>
              Configurar
            </button>
          </div>
        </section>
      )}
      {panelAbierto && <PanelPreferencias />}
    </>
  );
}

function PanelPreferencias() {
  const toast = useToast();
  const { estado, decision, aceptar, retirar, rechazar, cerrarPreferencias } = useConsentimiento();
  // Siempre arranca en lo que la persona YA eligió; si nunca eligió, en NO (nada activado por defecto).
  const [estadisticas, setEstadisticas] = useState(estado === "aceptado");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setGuardando(true);
    setError("");
    let r;
    if (estadisticas) r = estado === "aceptado" ? { ok: true, servidor: true } : await aceptar();
    else r = estado === "aceptado" ? await retirar() : await rechazar();
    setGuardando(false);
    if (!r.ok) {
      setError("No pudimos guardar tu elección. Revisa tu conexión e inténtalo de nuevo.");
      return;
    }
    if (!estadisticas && estado === "aceptado" && !r.servidor) {
      toast.warning("Dejamos de medir tu uso, pero no pudimos borrar tu historial del servidor ahora. Se elimina solo en un máximo de 180 días, o escríbenos para borrarlo antes.");
    } else {
      toast.success("Guardamos tus preferencias de privacidad");
    }
    cerrarPreferencias();
  };

  const fecha = decision?.decidido_en ? new Date(decision.decidido_en).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <Dialog labelledBy="prefs-privacidad-titulo" onClose={cerrarPreferencias} className="w-full max-w-lg">
      <div className="glass-strong max-h-[90vh] space-y-4 overflow-y-auto rounded-3xl p-6 shadow-glass-lg">
        <h2 id="prefs-privacidad-titulo" className="text-xl font-semibold text-plum">Preferencias de privacidad</h2>

        <section className="rounded-2xl border border-plum/10 bg-white/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-plum">Estrictamente necesario</h3>
            <span className="shrink-0 rounded-full bg-plum/10 px-2.5 py-0.5 text-xs font-semibold text-plum">Siempre activo</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-plum-soft">
            Mantiene tu sesión y la seguridad de tu cuenta, guarda tu carrito, tus pedidos y pagos, y recuerda esta misma
            elección. Sin esto la tienda no puede funcionar, por eso no se puede desactivar. No sirve para medirte ni
            para publicidad.
          </p>
        </section>

        <section className="rounded-2xl border border-plum/10 bg-white/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="prefs-estadisticas" className="text-sm font-semibold text-plum">Estadísticas de uso <span className="font-normal text-plum-soft">(opcional)</span></h3>
              <p id="prefs-estadisticas-desc" className="mt-1 text-xs leading-relaxed text-plum-soft">
                <strong className="text-plum">Qué:</strong> páginas y productos que ves, productos que agregas al carrito, y
                cuándo inicias y completas una compra, con un identificador aleatorio guardado en tu navegador (si tienes la
                sesión iniciada, se asocia a tu cuenta). <strong className="text-plum">Para qué:</strong> saber qué funciona y
                mejorar la tienda. <strong className="text-plum">Cuánto:</strong> 180 días. No usamos publicidad ni
                herramientas de terceros.
              </p>
            </div>
            <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                role="switch"
                aria-checked={estadisticas}
                aria-labelledby="prefs-estadisticas"
                aria-describedby="prefs-estadisticas-desc"
                checked={estadisticas}
                onChange={(e) => setEstadisticas(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-plum/25 transition peer-checked:bg-berry peer-focus-visible:ring-2 peer-focus-visible:ring-berry/50" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
            </label>
          </div>
          {estado === "aceptado" && fecha && (
            <p className="mt-2 text-xs text-plum-soft">
              Las aceptaste el {fecha}. Si las desactivas, dejamos de medirte, se borra el identificador de tu navegador y
              el historial asociado.
            </p>
          )}
        </section>

        {error && <p className="text-xs text-berry-dark" role="alert">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/politica-de-privacidad" onClick={cerrarPreferencias} className="text-xs font-semibold text-berry hover:underline">
            Política de privacidad
          </Link>
          <div className="flex gap-2">
            <button type="button" onClick={cerrarPreferencias} disabled={guardando} className={botonSecundario}>Cerrar</button>
            <button type="button" onClick={guardar} disabled={guardando} className={botonAceptar}>
              {guardando ? "Guardando…" : "Guardar mi elección"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
