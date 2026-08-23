import React, { useState } from "react";
import { api } from "../../api/client.js";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function haceUnMesISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export default function AdminReportes() {
  const [desde, setDesde] = useState(haceUnMesISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  const descargar = async (e) => {
    e.preventDefault();
    setDescargando(true);
    setError("");
    try {
      await api.adminReporteVentas(desde || undefined, hasta || undefined);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-plum">Reportes</h1>
      <p className="text-sm text-plum-soft">
        Descarga un resumen de ventas en PDF: total vendido, desglose por método de pago,
        por origen (en línea / tienda) y productos más vendidos.
      </p>

      <form onSubmit={descargar} className="glass mt-6 max-w-lg rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
          Reporte de ventas
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-plum-soft">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
            />
          </label>
          <label className="text-xs text-plum-soft">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
            />
          </label>
        </div>

        <p className="mt-2 text-xs text-plum-soft/70">
          Deja los campos vacíos para incluir todo el historial.
        </p>

        <button
          type="submit"
          disabled={descargando}
          className="mt-4 w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
        >
          {descargando ? "Generando reporte..." : "Descargar reporte PDF"}
        </button>
        {error && <p className="mt-2 text-center text-sm text-berry-dark">{error}</p>}
      </form>
    </div>
  );
}
