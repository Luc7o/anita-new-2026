import React from "react";
import { useSearchParams } from "react-router-dom";
import TabStock from "./almacen/TabStock.jsx";
import TabMovimientos from "./almacen/TabMovimientos.jsx";
import TabInventarioFisico from "./almacen/TabInventarioFisico.jsx";

const VISTAS = [
  { id: "stock", etiqueta: "Stock y alertas" },
  { id: "movimientos", etiqueta: "Movimientos y kardex" },
  { id: "inventario", etiqueta: "Inventario físico" },
];

export default function AdminAlmacen() {
  const [params, setParams] = useSearchParams();
  const vista = VISTAS.some((v) => v.id === params.get("vista")) ? params.get("vista") : "stock";

  const irA = (id) => setParams(id === "stock" ? {} : { vista: id });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-plum">Almacén</h1>
        <p className="text-sm text-plum-soft">Cuánto tienes, qué se movió y qué hay que reponer.</p>
      </div>

      <div role="tablist" aria-label="Secciones del almacén" className="mb-6 flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            role="tab"
            id={`tab-${v.id}`}
            aria-selected={vista === v.id}
            aria-controls={`panel-${v.id}`}
            onClick={() => irA(v.id)}
            className={`rounded-[10px] px-4 py-2 text-sm font-semibold transition ${
              vista === v.id ? "bg-berry text-white" : "bg-white text-plum ring-1 ring-plum/20 hover:ring-plum/40"
            }`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${vista}`} aria-labelledby={`tab-${vista}`}>
        {vista === "stock" && <TabStock />}
        {vista === "movimientos" && <TabMovimientos />}
        {vista === "inventario" && <TabInventarioFisico />}
      </div>
    </div>
  );
}
