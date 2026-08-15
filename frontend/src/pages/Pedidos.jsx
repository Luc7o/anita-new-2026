import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .misPedidos()
      .then(setPedidos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="mx-auto max-w-4xl px-4 py-16 text-plum-soft">Cargando pedidos...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <h1 className="mb-6 font-display text-2xl font-semibold text-plum">Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p className="text-plum-soft">Todavía no tienes pedidos.</p>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => (
            <Link
              key={p.id}
              to={`/pedidos/${p.id}`}
              className="glass flex items-center justify-between rounded-2xl p-4 shadow-glass transition hover:-translate-y-0.5"
            >
              <div>
                <p className="font-display font-medium text-plum">{p.numero_pedido}</p>
                <p className="text-sm text-plum-soft">
                  {new Date(p.fecha_creacion).toLocaleDateString("es-PE")} · {p.estado_label}
                </p>
              </div>
              <span className="font-display font-semibold text-berry-dark">
                S/ {p.total.toFixed(2)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
