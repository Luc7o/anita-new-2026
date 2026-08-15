import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { ESTADOS_PEDIDO } from "./estadosPedido.js";

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api
      .adminPedidos(estado ? { estado } : {})
      .then((data) => setPedidos(data.pedidos))
      .finally(() => setCargando(false));
  }, [estado]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-plum">Pedidos</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setEstado("")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass ${
            estado === "" ? "bg-berry text-white" : "glass text-plum"
          }`}
        >
          Todos
        </button>
        {Object.entries(ESTADOS_PEDIDO).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setEstado(valor)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass ${
              estado === valor ? "bg-berry text-white" : "glass text-plum"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-plum-soft">Cargando pedidos...</p>
      ) : (
        <div className="glass overflow-hidden rounded-3xl shadow-glass">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
              <tr>
                <th className="px-4 py-3">N° Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-t border-white/40">
                  <td className="px-4 py-3 font-medium text-plum">{p.numero_pedido}</td>
                  <td className="px-4 py-3 text-plum-soft">{p.cliente}</td>
                  <td className="px-4 py-3 text-plum-soft">
                    {new Date(p.fecha_creacion).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-plum-soft">S/ {p.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-berry/10 px-2.5 py-1 text-xs font-semibold text-berry-dark">
                      {p.estado_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.estado_pago !== "no_aplica" && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.estado_pago === "en_revision" || p.estado_pago === "reembolso_pendiente"
                            ? "bg-gold/30 text-plum"
                            : p.estado_pago === "verificado"
                            ? "bg-berry/10 text-berry-dark"
                            : p.estado_pago === "rechazado"
                            ? "bg-red-100 text-red-700"
                            : "bg-plum/10 text-plum-soft"
                        }`}
                      >
                        {p.estado_pago_label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/pedidos/${p.id}`} className="text-berry hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidos.length === 0 && (
            <p className="p-6 text-center text-plum-soft">No hay pedidos con ese filtro.</p>
          )}
        </div>
      )}
    </div>
  );
}
