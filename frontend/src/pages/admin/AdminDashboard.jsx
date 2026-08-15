import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.adminEstadisticas().then(setStats);
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-plum">Dashboard</h1>

      {!stats ? (
        <p className="text-plum-soft">Cargando métricas...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            <Tarjeta label="Clientes" valor={stats.total_clientes} />
            <Tarjeta label="Productos activos" valor={stats.total_productos} />
            <Tarjeta
              label="Bajo stock (≤3)"
              valor={stats.productos_bajo_stock}
              destacar={stats.productos_bajo_stock > 0}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Tarjeta small label="Pagos pendientes" valor={`S/ ${stats.monto_pagos_pendientes.toFixed(2)}`} />
            <Tarjeta small label="En revisión" valor={`S/ ${stats.monto_en_revision.toFixed(2)}`} />
            <Tarjeta small label="Rechazados" valor={`S/ ${stats.monto_rechazado.toFixed(2)}`} />
            <Tarjeta small label="Reembolsos" valor={`S/ ${stats.monto_reembolsos.toFixed(2)}`} />
            <Tarjeta small label="Cancelado" valor={`S/ ${stats.monto_cancelado.toFixed(2)}`} />
          </div>
          <p className="mt-2 text-xs text-plum-soft">
            "Ventas confirmadas" es solo dinero con pago verificado (o entregado, para
            métodos que no requieren verificación). Los montos de abajo son referencia —
            no están incluidos en ese total.
          </p>
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
      <p className={`mt-1 font-display font-semibold text-plum ${small ? "text-lg" : "text-2xl"}`}>{valor}</p>
    </div>
  );
}
