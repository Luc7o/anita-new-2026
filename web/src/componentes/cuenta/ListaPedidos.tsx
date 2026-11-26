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
      <div role="alert" className="flex flex-col items-start gap-3 border-t border-plum/10 py-6">
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
          <div key={i} aria-hidden="true" className="skeleton h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="border-t border-plum/10 py-6">
        <p className="text-plum-soft">Todavía no tienes pedidos.</p>
        <Link href="/tienda" className="btn btn-primary mt-4 inline-flex px-6!">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    // Lista con líneas finas: número y fecha a la izquierda, estado y total a la derecha.
    <ul className="border-t border-plum">
      {pedidos.map((p) => (
        <li key={p.id} className="border-b border-plum/10">
          <Link href={`/pedidos/${p.id}`} className="group flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="font-semibold text-plum group-hover:underline group-hover:underline-offset-4">{p.numero_pedido}</p>
              <p className="text-sm text-plum-soft">
                {new Date(p.fecha_creacion).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                <span className="sm:hidden"> · {p.estado_label}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="aviso-fino hidden sm:inline-flex">{p.estado_label}</span>
              <span className="precio text-plum">{soles(p.total)}</span>
              <span aria-hidden="true" className="text-plum-soft transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
