import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { IconChevronDown } from "../../components/Icons.jsx";

const COLORES_CATEGORIA = ["#A53694", "#CA8AC0", "#C9A227", "#E4C765", "#5A4756"];

const ESTADO_BADGE = {
  pendiente: "bg-plum/10 text-plum-soft",
  confirmado: "bg-gold/30 text-plum",
  preparando: "bg-gold/30 text-plum",
  enviado: "bg-blue-50 text-blue-600",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [verDetalleFinanciero, setVerDetalleFinanciero] = useState(false);

  useEffect(() => {
    api.adminEstadisticas().then(setStats);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-plum">Dashboard</h1>

      {!stats ? (
        <p className="text-plum-soft">Cargando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Tarjeta label="Ventas confirmadas" valor={`S/ ${stats.ventas_confirmadas.toFixed(2)}`} />
            <Tarjeta label="Pedidos" valor={stats.total_pedidos} />
            <Tarjeta
              label="Pedidos pendientes"
              valor={stats.pedidos_pendientes}
              destacar={stats.pedidos_pendientes > 0}
            />
            <Tarjeta
              label="Pagos por revisar"
              valor={stats.pagos_por_revisar}
              destacar={stats.pagos_por_revisar > 0}
            />
            <Tarjeta
              label="Reembolsos pendientes"
              valor={stats.reembolsos_pendientes}
              destacar={stats.reembolsos_pendientes > 0}
            />
            <Tarjeta
              label="Bajo stock (≤3)"
              valor={stats.productos_bajo_stock}
              destacar={stats.productos_bajo_stock > 0}
            />
          </div>

          <button
            onClick={() => setVerDetalleFinanciero((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-berry-dark hover:underline"
          >
            {verDetalleFinanciero ? "Ocultar" : "Ver"} detalle financiero
            <IconChevronDown size={14} className={`transition ${verDetalleFinanciero ? "rotate-180" : ""}`} />
          </button>

          {verDetalleFinanciero && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Tarjeta small label="Pagos pendientes" valor={`S/ ${stats.monto_pagos_pendientes.toFixed(2)}`} />
                <Tarjeta small label="En revisión" valor={`S/ ${stats.monto_en_revision.toFixed(2)}`} />
                <Tarjeta small label="Rechazados" valor={`S/ ${stats.monto_rechazado.toFixed(2)}`} />
                <Tarjeta small label="Reembolsos" valor={`S/ ${stats.monto_reembolsos.toFixed(2)}`} />
                <Tarjeta small label="Cancelado" valor={`S/ ${stats.monto_cancelado.toFixed(2)}`} />
              </div>
              <p className="mt-2 text-xs text-plum-soft">
                "Ventas confirmadas" es solo dinero con pago verificado (o entregado, para
                métodos que no requieren verificación). Los montos de arriba son referencia —
                no están incluidos en ese total.
              </p>
            </>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <VentasChart datos={stats.ventas_por_mes} />
            <TopCategorias datos={stats.top_categorias} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PedidosRecientes datos={stats.pedidos_recientes} />
            <ProductosTop datos={stats.productos_top} />
          </div>
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/admin/productos"
          className="rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark"
        >
          Gestionar productos
        </Link>
        <Link
          to="/admin/pedidos"
          className="glass rounded-full px-5 py-2.5 text-sm font-semibold text-plum shadow-glass transition hover:bg-white"
        >
          Ver pedidos
        </Link>
      </div>
    </div>
  );
}

function Tarjeta({ label, valor, destacar = false, small = false }) {
  return (
    <div className={`glass rounded-3xl p-5 shadow-glass ${destacar ? "ring-2 ring-gold" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-plum-soft">{label}</p>
      <p className={`mt-1 font-semibold text-plum ${small ? "text-lg" : "text-2xl"}`}>{valor}</p>
    </div>
  );
}

function VentasChart({ datos }) {
  const ancho = 560;
  const alto = 160;
  const max = Math.max(...datos.map((d) => d.total), 1);

  const puntos = datos.map((d, i) => {
    const x = (i / (datos.length - 1)) * ancho;
    const y = alto - (d.total / max) * (alto - 16) - 8;
    return { x, y, ...d };
  });

  const linea = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${alto} ${linea} ${ancho},${alto}`;

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">Ventas de los últimos 6 meses</h2>
      <p className="text-xs text-plum-soft">Ventas confirmadas por mes</p>

      {max <= 1 ? (
        <p className="mt-8 text-sm text-plum-soft">Todavía no hay suficientes ventas confirmadas para graficar.</p>
      ) : (
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="mt-4 w-full" preserveAspectRatio="none">
          <polygon points={area} fill="#A53694" fillOpacity="0.12" />
          <polyline points={linea} fill="none" stroke="#A53694" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {puntos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#A53694" />
          ))}
        </svg>
      )}
      <div className="mt-2 flex justify-between text-xs text-plum-soft">
        {datos.map((d) => (
          <span key={d.mes}>{d.mes}</span>
        ))}
      </div>
    </div>
  );
}

function TopCategorias({ datos }) {
  let acumulado = 0;
  const segmentos = datos.map((d, i) => {
    const inicio = acumulado;
    acumulado += d.porcentaje;
    return { ...d, inicio, fin: acumulado, color: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length] };
  });
  const gradiente = segmentos
    .map((s) => `${s.color} ${s.inicio}% ${s.fin}%`)
    .join(", ");

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">Categorías más vendidas</h2>
      <p className="text-xs text-plum-soft">Por unidades vendidas</p>

      {datos.length === 0 ? (
        <p className="mt-8 text-sm text-plum-soft">Todavía no hay ventas para calcular esto.</p>
      ) : (
        <div className="mt-4 flex items-center gap-6">
          <div
            className="h-32 w-32 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(${gradiente})`,
              WebkitMask: "radial-gradient(circle, transparent 58%, black 59%)",
              mask: "radial-gradient(circle, transparent 58%, black 59%)",
            }}
          />
          <div className="min-w-0 flex-1 space-y-2">
            {segmentos.map((s) => (
              <div key={s.nombre} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="flex-1 truncate text-plum">{s.nombre}</span>
                <span className="font-semibold text-plum-soft">{s.porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PedidosRecientes({ datos }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-plum">Pedidos recientes</h2>
        <Link to="/admin/pedidos" className="text-sm font-semibold text-berry-dark hover:underline">
          Ver todos
        </Link>
      </div>

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">Todavía no hay pedidos.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {datos.map((p) => (
            <div key={p.numero_pedido} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-plum">{p.numero_pedido}</p>
                <p className="truncate text-xs text-plum-soft">{p.cliente} · {p.producto_resumen}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-plum">S/ {p.total.toFixed(2)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_BADGE[p.estado] || "bg-plum/10 text-plum-soft"}`}>
                  {p.estado_label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductosTop({ datos }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">Productos más vendidos</h2>

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {datos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-plum">{p.nombre}</p>
                <p className="text-xs text-plum-soft">{p.categoria}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-plum">S/ {p.ingresos.toFixed(2)}</p>
                <p className="text-xs text-plum-soft">{p.unidades} vendidas</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
