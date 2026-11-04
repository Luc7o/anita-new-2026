import React, { useState } from "react";
import { api } from "../../../api/client.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { hoyISO } from "../../../formato.js";
import Spinner from "../../../components/Spinner.jsx";

const campoFecha =
  "rounded-[10px] bg-white px-3 py-1.5 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry";

function haceUnMesISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

/** Reportes en PDF que muestran costos: solo para quien puede ver costos. */
export default function PanelReportesCostos() {
  const toast = useToast();
  const [desde, setDesde] = useState(haceUnMesISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [generando, setGenerando] = useState("");

  const generar = async (cual) => {
    setGenerando(cual);
    try {
      if (cual === "valorizacion") await api.adminReporteValorizacion();
      else await api.adminReporteMargen(desde || undefined, hasta || undefined);
    } catch (err) {
      toast.error(err.message || "No se pudo generar el reporte");
    } finally {
      setGenerando("");
    }
  };

  const boton =
    "inline-flex items-center rounded-[10px] bg-white px-4 py-2 text-sm font-semibold text-berry ring-1 ring-berry/40 transition hover:bg-berry/10 disabled:opacity-60";

  return (
    <section aria-label="Reportes de costos" className="glass mb-4 rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-plum">Reportes de costos (PDF)</p>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <button type="button" onClick={() => generar("valorizacion")} disabled={Boolean(generando)} className={boton}>
          {generando === "valorizacion" && <Spinner />}
          Valorización del inventario
        </button>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-plum-soft">
            Desde
            <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className={`${campoFecha} mt-1 block`} />
          </label>
          <label className="text-xs text-plum-soft">
            Hasta
            <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={`${campoFecha} mt-1 block`} />
          </label>
          <button type="button" onClick={() => generar("margen")} disabled={Boolean(generando)} className={boton}>
            {generando === "margen" && <Spinner />}
            Margen por producto
          </button>
        </div>
      </div>
    </section>
  );
}
