"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pedir } from "@/lib/api";
import { soles } from "@/lib/precio";

type PedidoResumen = { id: number; numero_pedido: string; fecha_creacion: string; estado_label: string; total: number };

export function ListaPedidos() {
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    pedir<PedidoResumen[]>("/pedidos", { auth: true })
      .then((p) => vigente && setPedidos(p))
      .catch((e) => vigente && setError(e instanceof Error ? e.message : "No pudimos cargar tus pedidos."));
    return () => {
      vigente = false;
    };
  }, [intento]);

  if (error) {
    return (
      <div role="alert" className="glass flex flex-col items-center gap-3 rounded-2xl p-8 text-center">
        <p className="text-plum-soft">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError("");
            setIntento((n) => n + 1);
          }}
          className="btn btn-primary px-6!"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!pedidos) {
    return (
      <div role="status" aria-label="Cargando pedidos" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="skeleton h-18 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-plum-soft">Todavía no tienes pedidos.</p>
        <Link href="/tienda" className="btn btn-primary mt-4 px-6!">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map((p) => (
        <Link
          key={p.id}
          href={`/pedidos/${p.id}`}
          className="glass flex items-center justify-between rounded-2xl p-4 shadow-glass transition hover:-translate-y-0.5"
        >
          <div>
            <p className="font-medium text-plum">{p.numero_pedido}</p>
            <p className="text-sm text-plum-soft">
              {new Date(p.fecha_creacion).toLocaleDateString("es-PE")} · {p.estado_label}
            </p>
          </div>
          <span className="font-semibold text-berry-dark">{soles(p.total)}</span>
        </Link>
      ))}
    </div>
  );
}
