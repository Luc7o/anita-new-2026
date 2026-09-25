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
  const [kpis, setKpis] = useState(null);
  const [verDetalleFinanciero, setVerDetalleFinanciero] = useState(false);

  useEffect(() => {
    api.adminEstadisticas().then(setStats);
    api.adminKpisAvanzados().then(setKpis);
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

          <h2 className="mt-8 text-lg font-semibold text-plum">Visitas de usuario</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Tarjeta label="Visitas hoy" valor={stats.visitas_hoy} />
            <Tarjeta label="Visitantes hoy" valor={stats.visitantes_hoy} />
            <Tarjeta label="Visitantes (7 días)" valor={stats.visitantes_7dias} />
          </div>
          <div className="mt-4">
            <VisitasChart datos={stats.visitas_por_dia} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PedidosRecientes datos={stats.pedidos_recientes} />
            <ProductosTop datos={stats.productos_top} />
          </div>

          {!kpis ? (
            <p className="mt-8 text-plum-soft">Cargando KPIs avanzados...</p>
          ) : (
            <>
              <h2 className="mt-8 text-lg font-semibold text-plum">Embudo de conversión</h2>
              <p className="text-xs text-plum-soft">Últimos 30 días</p>
              <div className="mt-3">
                <Embudo datos={kpis.embudo_conversion} />
              </div>

              <h2 className="mt-8 text-lg font-semibold text-plum">Abandono de carrito</h2>
              <p className="text-xs text-plum-soft">
                Ítems que siguen en el carrito ahora mismo (lo que ya se compró o se quitó no cuenta acá)
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Tarjeta
                  label="Antigüedad promedio"
                  valor={kpis.antiguedad_promedio_carrito_horas != null ? `${kpis.antiguedad_promedio_carrito_horas} h` : "—"}
                />
                <Tarjeta
                  label="Abandonados (+48h)"
                  valor={kpis.carritos_abandonados_48h}
                  destacar={kpis.carritos_abandonados_48h > 0}
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="glass rounded-3xl p-6 shadow-glass">
                  <h2 className="text-lg font-semibold text-plum">Tiempos entre estados de pedido</h2>
                  <p className="text-xs text-plum-soft">Promedio, de punta a punta del flujo</p>
                  {kpis.tiempos_entre_estados.length === 0 ? (
                    <p className="mt-4 text-sm text-plum-soft">Todavía no hay suficientes cambios de estado.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {kpis.tiempos_entre_estados.map((t) => (
                        <div key={t.transicion} className="flex items-center justify-between text-sm">
                          <span className="text-plum">{t.transicion}</span>
                          <span className="font-semibold text-plum-soft">{t.horas_promedio} h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass rounded-3xl p-6 shadow-glass">
                  <h2 className="text-lg font-semibold text-plum">Tiempo de pago y entrega</h2>
                  <p className="text-xs text-plum-soft">Promedio desde que se crea el pedido</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-plum-soft">Hasta el pago</p>
                      <p className="mt-1 text-xl font-semibold text-plum">
                        {kpis.tiempo_pago_promedio_horas != null ? `${kpis.tiempo_pago_promedio_horas} h` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-plum-soft">Hasta la entrega</p>
                      <p className="mt-1 text-xl font-semibold text-plum">
                        {kpis.tiempo_entrega_promedio_horas != null ? `${kpis.tiempo_entrega_promedio_horas} h` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BarrasHorizontales
                  titulo="Motivos de cancelación"
                  vacioTexto="Todavía no hay pedidos cancelados."
                  datos={kpis.motivos_cancelacion.map((m) => ({ label: m.motivo, valor: m.cantidad }))}
                />
                <BarrasHorizontales
                  titulo="Ventas por zona"
                  subtitulo="Top distritos por monto vendido"
                  vacioTexto="Todavía no hay ventas con distrito registrado."
                  datos={kpis.ventas_por_zona.map((z) => ({
                    label: z.distrito,
                    valor: z.total,
                    formato: (v) => `S/ ${v.toFixed(2)}`,
                    detalle: `${z.pedidos} pedido${z.pedidos === 1 ? "" : "s"}`,
                  }))}
                />
              </div>

              <h2 className="mt-8 text-lg font-semibold text-plum">Stock</h2>
              <p className="text-xs text-plum-soft">Últimos 30 días</p>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Tarjeta label="Unidades vendidas" valor={kpis.unidades_vendidas_30d} />
                <Tarjeta label="Unidades restauradas" valor={kpis.unidades_restauradas_30d} />
                <Tarjeta
                  label="Productos sin stock"
                  valor={kpis.productos_sin_stock}
                  destacar={kpis.productos_sin_stock > 0}
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="glass rounded-3xl p-6 shadow-glass">
                  <h2 className="text-lg font-semibold text-plum">Pagos con Culqi</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Tarjeta small label="Intentos" valor={kpis.total_intentos_pago} />
                    <Tarjeta
                      small
                      label="Tasa de rechazo"
                      valor={kpis.tasa_rechazo_pago != null ? `${kpis.tasa_rechazo_pago}%` : "—"}
                      destacar={kpis.tasa_rechazo_pago > 20}
                    />
                  </div>
                  {kpis.motivos_rechazo_pago.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-white/50 pt-3">
                      {kpis.motivos_rechazo_pago.map((m) => (
                        <div key={m.motivo} className="flex items-center justify-between text-sm">
                          <span className="min-w-0 truncate text-plum">{m.motivo}</span>
                          <span className="shrink-0 font-semibold text-plum-soft">{m.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass rounded-3xl p-6 shadow-glass">
                  <h2 className="text-lg font-semibold text-plum">Performance del backend</h2>
                  <p className="text-xs text-plum-soft">Últimas 24 horas</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-plum-soft">Latencia prom.</p>
                      <p className="mt-1 text-lg font-semibold text-plum">
                        {kpis.latencia_promedio_ms != null ? `${kpis.latencia_promedio_ms} ms` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-plum-soft">Tasa de error</p>
                      <p className="mt-1 text-lg font-semibold text-plum">
                        {kpis.tasa_error_24h != null ? `${kpis.tasa_error_24h}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-plum-soft">Requests</p>
                      <p className="mt-1 text-lg font-semibold text-plum">{kpis.total_requests_24h}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="mt-8 text-lg font-semibold text-plum">Uso de promociones</h2>
              <div className="mt-3 glass rounded-3xl p-6 shadow-glass">
                {kpis.promociones_usadas === 0 ? (
                  <p className="text-sm text-plum-soft">
                    Todavía sin datos: el checkout no aplica cupones/códigos de descuento hoy — las
                    promociones actuales son solo el banner del inicio. Esta métrica queda lista para
                    cuando exista esa función.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Tarjeta small label="Promociones usadas" valor={kpis.promociones_usadas} />
                    <Tarjeta small label="Descuento total" valor={`S/ ${kpis.monto_descuento_total.toFixed(2)}`} />
                  </div>
                )}
              </div>
            </>
          )}
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

function VisitasChart({ datos }) {
  const max = Math.max(...datos.map((d) => d.visitas), 1);
  const sinDatos = datos.every((d) => d.visitas === 0);

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">Visitas de los últimos 7 días</h2>
      <p className="text-xs text-plum-soft">Vistas de página totales, visitantes únicos superpuestos</p>

      {sinDatos ? (
        <p className="mt-8 text-sm text-plum-soft">Todavía no hay visitas registradas.</p>
      ) : (
        <div className="mt-6 flex h-32 items-end justify-between gap-2">
          {datos.map((d) => (
            <div key={d.dia} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-24 w-full items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t-lg bg-berry/15"
                  style={{ height: `${Math.max((d.visitas / max) * 100, d.visitas > 0 ? 6 : 0)}%` }}
                  title={`${d.visitas} visitas`}
                />
                <div
                  className="absolute bottom-0 w-full max-w-[28px] rounded-t-lg bg-berry"
                  style={{ height: `${Math.max((d.visitantes / max) * 100, d.visitantes > 0 ? 6 : 0)}%` }}
                  title={`${d.visitantes} visitantes únicos`}
                />
              </div>
              <span className="text-xs text-plum-soft">{d.dia}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Embudo({ datos }) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);
  const sinDatos = datos.every((d) => d.cantidad === 0);

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      {sinDatos ? (
        <p className="text-sm text-plum-soft">Todavía no hay suficientes eventos para calcular el embudo.</p>
      ) : (
        <div className="space-y-3">
          {datos.map((paso, i) => (
            <div key={paso.paso}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-plum">{paso.paso}</span>
                <span className="font-semibold text-plum-soft">
                  {paso.cantidad}
                  {i > 0 && paso.tasa_desde_anterior != null && (
                    <span className="ml-2 text-xs font-normal text-plum-soft/70">
                      ({paso.tasa_desde_anterior}% del paso anterior)
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-berry"
                  style={{ width: `${Math.max((paso.cantidad / max) * 100, paso.cantidad > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BarrasHorizontales({ titulo, subtitulo, vacioTexto, datos }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {subtitulo && <p className="text-xs text-plum-soft">{subtitulo}</p>}

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">{vacioTexto}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {datos.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="min-w-0 truncate text-plum">{d.label}</span>
                <span className="shrink-0 font-semibold text-plum-soft">
                  {d.formato ? d.formato(d.valor) : d.valor}
                  {d.detalle && <span className="ml-1.5 text-xs font-normal text-plum-soft/70">· {d.detalle}</span>}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div className="h-full rounded-full bg-berry" style={{ width: `${Math.max((d.valor / max) * 100, 3)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
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
