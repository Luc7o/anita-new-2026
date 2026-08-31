import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function ListaPedidos({ pedidosBase = "/pedidos" }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .misPedidos()
      .then(setPedidos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-plum-soft">Cargando pedidos...</p>;
  }

  if (pedidos.length === 0) {
    return <p className="text-plum-soft">Todavía no tienes pedidos.</p>;
  }

  return (
    <div className="space-y-3">
      {pedidos.map((p) => (
        <Link
          key={p.id}
          to={`${pedidosBase}/${p.id}`}
          className="glass flex items-center justify-between rounded-2xl p-4 shadow-glass transition hover:-translate-y-0.5"
        >
          <div>
            <p className="font-medium text-plum">{p.numero_pedido}</p>
            <p className="text-sm text-plum-soft">
              {new Date(p.fecha_creacion).toLocaleDateString("es-PE")} · {p.estado_label}
            </p>
          </div>
          <span className="font-semibold text-berry-dark">
            S/ {p.total.toFixed(2)}
          </span>
        </Link>
      ))}
    </div>
  );
}
