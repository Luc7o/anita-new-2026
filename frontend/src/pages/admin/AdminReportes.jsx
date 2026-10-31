import Spinner from "../../components/Spinner.jsx";
import React, { useState } from "react";
import { api } from "../../api/client.js";
import { hoyISO } from "../../formato.js";

function haceUnMesISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

const entrada = "mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/30 hover:ring-plum/50 focus:outline-none focus:ring-2 focus:ring-berry";

// Tarjeta de un reporte: título, qué incluye, filtros y botón de descarga.
function TarjetaReporte({ titulo, descripcion, onGenerar, boton, children }) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setGenerando(true);
    setError("");
    try {
      await onGenerar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="glass flex flex-col rounded-2xl p-6">
      <h2 className="text-lg font-bold text-plum">{titulo}</h2>
      <p className="mt-1 text-sm text-plum-soft">{descripcion}</p>
      <div className="mt-4 flex-1 space-y-3">{children}</div>
      <button
        type="submit"
        disabled={generando}
        className="mt-5 w-full rounded-[10px] bg-berry py-3 text-center font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
      >
        {generando ? <><Spinner />Generando reporte...</> : boton}
      </button>
      {error && <p role="alert" className="mt-2 text-center text-sm text-berry-dark">{error}</p>}
    </form>
  );
}

function CamposFechas({ desde, hasta, setDesde, setHasta }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-plum-soft">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className={entrada} />
        </label>
        <label className="text-xs text-plum-soft">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={entrada} />
        </label>
      </div>
      <p className="text-xs text-plum-soft/70">Deja los campos vacíos para incluir todo el historial.</p>
    </>
  );
}

export default function AdminReportes() {
  const [desdeV, setDesdeV] = useState(haceUnMesISO());
  const [hastaV, setHastaV] = useState(hoyISO());
  const [desdeC, setDesdeC] = useState(haceUnMesISO());
  const [hastaC, setHastaC] = useState(hoyISO());
  const [soloAlerta, setSoloAlerta] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-plum">Reportes</h1>
      <p className="text-sm text-plum-soft">Descarga resúmenes en PDF de tus ventas, tu inventario y tus clientes.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <TarjetaReporte
          titulo="Ventas"
          descripcion="Totales con IGV, desglose por método de pago y origen, productos más vendidos, ventas por día y detalle de pedidos."
          boton="Generar PDF"
          onGenerar={() => api.adminReporteVentas(desdeV || undefined, hastaV || undefined)}
        >
          <CamposFechas desde={desdeV} hasta={hastaV} setDesde={setDesdeV} setHasta={setHastaV} />
        </TarjetaReporte>

        <TarjetaReporte
          titulo="Inventario"
          descripcion="Stock actual por producto y categoría, productos agotados o por reponer, y valor del inventario a precio de venta."
          boton="Generar PDF"
          onGenerar={() => api.adminReporteInventario(soloAlerta)}
        >
          <label className="flex cursor-pointer items-start gap-2 text-sm text-plum">
            <input type="checkbox" checked={soloAlerta} onChange={(e) => setSoloAlerta(e.target.checked)} className="mt-1 accent-berry" />
            <span>
              Solo productos por reponer
              <span className="block text-xs text-plum-soft">Agotados o con 3 unidades o menos.</span>
            </span>
          </label>
        </TarjetaReporte>

        <TarjetaReporte
          titulo="Clientes"
          descripcion="Clientes registrados, nuevos del periodo, quiénes compraron, recurrentes y los que más compran."
          boton="Generar PDF"
          onGenerar={() => api.adminReporteClientes(desdeC || undefined, hastaC || undefined)}
        >
          <CamposFechas desde={desdeC} hasta={hastaC} setDesde={setDesdeC} setHasta={setHastaC} />
        </TarjetaReporte>
      </div>
    </div>
  );
}
