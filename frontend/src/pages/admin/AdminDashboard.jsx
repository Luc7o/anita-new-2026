import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { IconChevronDown } from "../../components/Icons.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { SUPERADMIN, PUEDE_VER_DASHBOARD } from "../../roles.js";

const COLORES_CATEGORIA = ["#A53694", "#CA8AC0", "#C9A227", "#E4C765", "#5A4756"];

const ESTADO_BADGE = {
  pendiente: "bg-plum/10 text-plum-soft",
  confirmado: "bg-gold/30 text-plum",
  preparando: "bg-gold/30 text-plum",
  enviado: "bg-blue-50 text-blue-600",
  entregado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

// Qué secciones ve cada rol. La pantalla de entrada ("Resumen") es corta a
// propósito: lo que necesitas saber hoy y lo que tienes que hacer. El detalle
// está una pestaña más adentro. Los datos técnicos (Sistema) son solo del
// Super administrador. El servidor además recorta los datos por rol, así que
// ocultar una pestaña acá es comodidad, no la barrera de seguridad.
const TODAS_LAS_VISTAS = [
  { id: "resumen", label: "Resumen" },
  { id: "ventas", label: "Ventas" },
  { id: "trafico", label: "Tráfico" },
  { id: "operacion", label: "Operación" },
  { id: "sistema", label: "Sistema" },
];

function vistasDelRol(rol) {
  if (rol === SUPERADMIN) return TODAS_LAS_VISTAS;
  if (PUEDE_VER_DASHBOARD.includes(rol)) return TODAS_LAS_VISTAS.filter((v) => v.id !== "sistema");
  if (rol === "ventas") return TODAS_LAS_VISTAS.filter((v) => ["resumen", "ventas"].includes(v.id));
  return TODAS_LAS_VISTAS.filter((v) => v.id === "resumen");
}

// Roles que pueden consultar estadísticas (el resto solo ve el panel de pendientes).
const ROLES_CON_ESTADISTICAS = ["superadmin", "administrativo", "auditor", "ventas", "almacen"];

const soles = (n) => `S/ ${Number(n).toFixed(2)}`;

export default function AdminDashboard() {
  const { cargando, usuario } = useAuth();
  const rol = usuario?.rol;
  const vistas = vistasDelRol(rol);
  const [params, setParams] = useSearchParams();
  const pedida = params.get("vista");
  const vista = vistas.some((v) => v.id === pedida) ? pedida : "resumen";

  const [atencion, setAtencion] = useState(null);
  const [stats, setStats] = useState(null);
  const [errorStats, setErrorStats] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [errorKpis, setErrorKpis] = useState(false);
  const kpisSolicitados = useRef(false);
  const tieneEstadisticas = ROLES_CON_ESTADISTICAS.includes(rol);
  const tieneKpis = PUEDE_VER_DASHBOARD.includes(rol);

  useEffect(() => {
    // No disparar las llamadas admin hasta que AuthContext termine de
    // recuperar (o descartar) la sesión con /auth/refrescar-token: si
    // salen antes, el access token todavía es null, el fetch va sin
    // header Authorization, y el backend responde 401 "token_faltante"
    // (no "token_expirado"), que fetchAutenticado no reintenta.
    if (cargando || !rol) return;
    api.adminAtencion().then((d) => setAtencion(d.items)).catch(() => setAtencion([]));
    if (tieneEstadisticas) {
      api.adminEstadisticas().then(setStats).catch((err) => {
        console.error("No se pudieron cargar las estadísticas del dashboard:", err);
        setErrorStats(true);
      });
    }
  }, [cargando, rol, tieneEstadisticas]);

  // Los KPIs avanzados son la parte más pesada: solo se piden cuando alguien
  // abre una pestaña que los usa, y una sola vez.
  useEffect(() => {
    if (cargando || !tieneKpis || vista === "resumen" || kpisSolicitados.current) return;
    kpisSolicitados.current = true;
    api.adminKpisAvanzados().then(setKpis).catch((err) => {
      console.error("No se pudieron cargar los KPIs avanzados:", err);
      setErrorKpis(true);
    });
  }, [cargando, tieneKpis, vista]);

  const cambiarVista = (id) => {
    setParams(id === "resumen" ? {} : { vista: id }, { replace: true });
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-plum">Dashboard</h1>

      {vistas.length > 1 && <Pestanas vistas={vistas} activa={vista} onCambiar={cambiarVista} />}

      <div
        role={vistas.length > 1 ? "tabpanel" : undefined}
        id={`panel-${vista}`}
        aria-labelledby={vistas.length > 1 ? `tab-${vista}` : undefined}
      >
        {vista === "resumen" && (
          <VistaResumen atencion={atencion} stats={stats} errorStats={errorStats} tieneEstadisticas={tieneEstadisticas} />
        )}
        {vista === "ventas" && <VistaVentas stats={stats} errorStats={errorStats} kpis={kpis} errorKpis={errorKpis} tieneKpis={tieneKpis} />}
        {vista === "trafico" && <VistaTrafico stats={stats} errorStats={errorStats} kpis={kpis} errorKpis={errorKpis} />}
        {vista === "operacion" && <VistaOperacion kpis={kpis} errorKpis={errorKpis} />}
        {vista === "sistema" && <VistaSistema kpis={kpis} errorKpis={errorKpis} />}
      </div>
    </div>
  );
}

function Pestanas({ vistas, activa, onCambiar }) {
  const botones = useRef({});

  const alTeclear = (e, indice) => {
    let destino = null;
    if (e.key === "ArrowRight") destino = (indice + 1) % vistas.length;
    else if (e.key === "ArrowLeft") destino = (indice - 1 + vistas.length) % vistas.length;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = vistas.length - 1;
    if (destino === null) return;
    e.preventDefault();
    const id = vistas[destino].id;
    onCambiar(id);
    botones.current[id]?.focus();
  };

  return (
    <div role="tablist" aria-label="Secciones del dashboard" className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {vistas.map((v, i) => (
        <button
          key={v.id}
          ref={(el) => (botones.current[v.id] = el)}
          role="tab"
          id={`tab-${v.id}`}
          aria-selected={activa === v.id}
          aria-controls={`panel-${v.id}`}
          tabIndex={activa === v.id ? 0 : -1}
          onClick={() => onCambiar(v.id)}
          onKeyDown={(e) => alTeclear(e, i)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass transition ${
            activa === v.id ? "bg-berry text-white" : "glass text-plum hover:bg-white"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function Cargando({ error, textoError = "No se pudieron cargar las métricas. Recarga la página para intentarlo de nuevo." }) {
  return error ? (
    <p role="alert" className="glass rounded-3xl p-6 text-sm text-red-700 shadow-glass">{textoError}</p>
  ) : (
    <p className="text-plum-soft" role="status">Cargando métricas...</p>
  );
}

// Todo el texto del dashboard vive dentro de tarjetas con el mismo margen
// interior (p-6), así títulos, notas y cifras arrancan en la misma línea.
function SeccionTarjeta({ titulo, nota, children }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {nota && <p className="text-xs text-plum-soft">{nota}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Dato({ label, valor, destacar = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-plum-soft">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${destacar ? "text-berry-dark" : "text-plum"}`}>{valor}</p>
    </div>
  );
}

// ---------------------------------------------------------------- Resumen

function PanelAtencion({ items }) {
  if (items === null) {
    return <p className="text-sm text-plum-soft" role="status">Revisando pendientes...</p>;
  }
  if (items.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 shadow-glass">
        <p className="font-semibold text-plum">Todo al día ✓</p>
        <p className="text-sm text-plum-soft">No tienes nada pendiente por atender ahora mismo.</p>
      </div>
    );
  }
  return (
    <section aria-labelledby="atencion-titulo" className="glass rounded-3xl p-6 shadow-glass">
      <h2 id="atencion-titulo" className="text-lg font-semibold text-plum">Necesita tu atención</h2>
      <ul className="mt-3 divide-y divide-plum/10">
        {items.map((it) => (
          <li key={it.clave}>
            <Link to={it.enlace} className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:text-berry">
              <span className="flex items-center gap-2 text-plum">
                {it.urgente && (
                  <span className="rounded-full bg-gold/30 px-2 py-0.5 text-xs font-semibold text-plum">Urgente</span>
                )}
                {it.texto}
              </span>
              <span aria-hidden="true" className="text-berry">Ver →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Compara el mes actual con el anterior para que el número diga si va bien o mal.
function resumenVentasDelMes(ventasPorMes) {
  if (!ventasPorMes || ventasPorMes.length < 2) return null;
  const actual = ventasPorMes[ventasPorMes.length - 1];
  const anterior = ventasPorMes[ventasPorMes.length - 2];
  let detalle;
  if (anterior.total > 0) {
    const pct = Math.round(((actual.total - anterior.total) / anterior.total) * 100);
    detalle = pct === 0 ? `Igual que en ${anterior.mes}` : `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% frente a ${anterior.mes}`;
  } else {
    detalle = actual.total > 0 ? `Sin ventas en ${anterior.mes}` : "Sin ventas todavía";
  }
  return { mes: actual.mes, total: actual.total, detalle };
}

function mejorMes(ventasPorMes) {
  const conVentas = (ventasPorMes || []).filter((m) => m.total > 0);
  if (conVentas.length < 2) return null;
  return conVentas.reduce((a, b) => (b.total > a.total ? b : a));
}

function VistaResumen({ atencion, stats, errorStats, tieneEstadisticas }) {
  const ventasMes = stats ? resumenVentasDelMes(stats.ventas_por_mes) : null;
  const mejor = stats ? mejorMes(stats.ventas_por_mes) : null;

  return (
    <div className="space-y-6">
      <PanelAtencion items={atencion} />

      {tieneEstadisticas &&
        (!stats ? (
          <Cargando error={errorStats} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {ventasMes && (
                <Tarjeta label={`Ventas de ${ventasMes.mes}`} valor={soles(ventasMes.total)} detalle={ventasMes.detalle} />
              )}
              <Tarjeta label="Pedidos pendientes" valor={stats.pedidos_pendientes} destacar={stats.pedidos_pendientes > 0} />
              <Tarjeta
                label="Poco stock"
                valor={stats.productos_bajo_stock}
                detalle="Productos con 3 unidades o menos"
                destacar={stats.productos_bajo_stock > 0}
              />
              {stats.visitas_hoy !== undefined ? (
                <Tarjeta label="Visitas hoy" valor={stats.visitas_hoy} detalle={`${stats.visitantes_hoy} personas distintas`} />
              ) : (
                <Tarjeta label="Productos activos" valor={stats.total_productos} />
              )}
            </div>

            {stats.ventas_por_mes && (
              <VentasChart
                datos={stats.ventas_por_mes}
                pie={
                  mejor && (
                    <>
                      Tu mejor mes fue <strong className="text-plum">{mejor.mes}</strong> con {soles(mejor.total)}.
                    </>
                  )
                }
              />
            )}

            {stats.pedidos_recientes && <PedidosRecientes datos={stats.pedidos_recientes} />}
          </>
        ))}

      <div className="flex flex-wrap gap-3">
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

// ----------------------------------------------------------------- Ventas

function VistaVentas({ stats, errorStats, kpis, errorKpis, tieneKpis }) {
  const [verDetalleFinanciero, setVerDetalleFinanciero] = useState(false);
  if (!stats) return <Cargando error={errorStats} />;
  const hayDetalleFinanciero = stats.monto_pagos_pendientes !== undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Tarjeta label="Ventas confirmadas" valor={soles(stats.ventas_confirmadas)} detalle="Total desde que abriste la tienda" />
        <Tarjeta label="Pedidos" valor={stats.total_pedidos} />
        {stats.total_clientes !== undefined && <Tarjeta label="Clientes registrados" valor={stats.total_clientes} />}
      </div>

      {hayDetalleFinanciero && (
        <div className="glass rounded-3xl p-6 shadow-glass">
          <button
            onClick={() => setVerDetalleFinanciero((v) => !v)}
            aria-expanded={verDetalleFinanciero}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-lg font-semibold text-plum">Detalle financiero</span>
              <span className="block text-xs text-plum-soft">Montos de referencia, no incluidos en "Ventas confirmadas"</span>
            </span>
            <IconChevronDown size={16} className={`shrink-0 text-berry transition ${verDetalleFinanciero ? "rotate-180" : ""}`} />
          </button>
          {verDetalleFinanciero && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Dato label="Pagos pendientes" valor={soles(stats.monto_pagos_pendientes)} />
                <Dato label="En revisión" valor={soles(stats.monto_en_revision)} />
                <Dato label="Rechazados" valor={soles(stats.monto_rechazado)} />
                <Dato label="Reembolsos" valor={soles(stats.monto_reembolsos)} />
                <Dato label="Cancelado" valor={soles(stats.monto_cancelado)} />
              </div>
              <p className="mt-4 text-xs text-plum-soft">
                "Ventas confirmadas" es solo dinero con pago verificado (o entregado, para métodos que no
                requieren verificación). Estos montos son referencia y no están incluidos en ese total.
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {stats.top_categorias && <TopCategorias datos={stats.top_categorias} />}
        {stats.productos_top && <ProductosTop datos={stats.productos_top} />}
      </div>

      {tieneKpis &&
        (!kpis ? (
          <Cargando error={errorKpis} />
        ) : (
          <BarrasHorizontales
            titulo="Ventas por zona"
            subtitulo="Distritos donde más vendes"
            vacioTexto="Todavía no hay ventas con distrito registrado."
            datos={kpis.ventas_por_zona.map((z) => ({
              label: z.distrito,
              valor: z.total,
              formato: (v) => `S/ ${v.toFixed(2)}`,
              detalle: `${z.pedidos} pedido${z.pedidos === 1 ? "" : "s"}`,
            }))}
          />
        ))}
    </div>
  );
}

// ---------------------------------------------------------------- Tráfico

function fraseEmbudo(datos) {
  const primero = datos[0];
  const ultimo = datos[datos.length - 1];
  if (!primero || primero.cantidad === 0) return null;
  const por100 = Math.round((ultimo.cantidad / primero.cantidad) * 100);
  return (
    <>
      De cada 100 personas que ven un producto, <strong className="text-plum">{por100}</strong> terminan comprando.
    </>
  );
}

function VistaTrafico({ stats, errorStats, kpis, errorKpis }) {
  if (!stats) return <Cargando error={errorStats} />;
  return (
    <div className="space-y-6">
      <SeccionTarjeta titulo="Visitas" nota="Cuánta gente entra a tu tienda">
        <div className="grid grid-cols-3 gap-4">
          <Dato label="Visitas hoy" valor={stats.visitas_hoy} />
          <Dato label="Personas hoy" valor={stats.visitantes_hoy} />
          <Dato label="Personas (7 días)" valor={stats.visitantes_7dias} />
        </div>
      </SeccionTarjeta>

      <VisitasChart datos={stats.visitas_por_dia} />

      {!kpis ? (
        <Cargando error={errorKpis} />
      ) : (
        <>
          <Embudo
            titulo="¿Cuántos visitantes terminan comprando?"
            nota="Últimos 30 días: ¿en qué paso se van los clientes?"
            intro={fraseEmbudo(kpis.embudo_conversion)}
            datos={kpis.embudo_conversion}
          />

          <SeccionTarjeta titulo="Carritos abandonados" nota="Productos que siguen en el carrito ahora mismo, sin comprar">
            <div className="grid grid-cols-2 gap-4">
              <Dato label="Llevan más de 2 días" valor={kpis.carritos_abandonados_48h} destacar={kpis.carritos_abandonados_48h > 0} />
              <Dato
                label="Antigüedad promedio"
                valor={kpis.antiguedad_promedio_carrito_horas != null ? `${kpis.antiguedad_promedio_carrito_horas} h` : "—"}
              />
            </div>
          </SeccionTarjeta>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------- Operación

function VistaOperacion({ kpis, errorKpis }) {
  if (!kpis) return <Cargando error={errorKpis} />;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SeccionTarjeta titulo="¿Cuánto demoramos?" nota="Promedio desde que el cliente hace el pedido">
          <div className="grid grid-cols-2 gap-4">
            <Dato label="Hasta el pago" valor={kpis.tiempo_pago_promedio_horas != null ? `${kpis.tiempo_pago_promedio_horas} h` : "—"} />
            <Dato label="Hasta la entrega" valor={kpis.tiempo_entrega_promedio_horas != null ? `${kpis.tiempo_entrega_promedio_horas} h` : "—"} />
          </div>
        </SeccionTarjeta>

        <SeccionTarjeta titulo="Tiempo en cada paso del pedido" nota="Promedio entre un estado y el siguiente">
          {kpis.tiempos_entre_estados.length === 0 ? (
            <p className="text-sm text-plum-soft">Todavía no hay suficientes cambios de estado.</p>
          ) : (
            <div className="space-y-2">
              {kpis.tiempos_entre_estados.map((t) => (
                <div key={t.transicion} className="flex items-center justify-between text-sm">
                  <span className="text-plum">{t.transicion}</span>
                  <span className="font-semibold text-plum-soft">{t.horas_promedio} h</span>
                </div>
              ))}
            </div>
          )}
        </SeccionTarjeta>
      </div>

      <BarrasHorizontales
        titulo="¿Por qué se cancelan los pedidos?"
        vacioTexto="Todavía no hay pedidos cancelados."
        datos={kpis.motivos_cancelacion.map((m) => ({ label: m.motivo, valor: m.cantidad }))}
      />

      <SeccionTarjeta titulo="Stock" nota="Últimos 30 días">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Dato label="Unidades vendidas" valor={kpis.unidades_vendidas_30d} />
          <Dato label="Unidades devueltas al stock" valor={kpis.unidades_restauradas_30d} />
          <Dato label="Productos sin stock" valor={kpis.productos_sin_stock} destacar={kpis.productos_sin_stock > 0} />
        </div>
      </SeccionTarjeta>
    </div>
  );
}

// ---------------------------------------------------------------- Sistema

function VistaSistema({ kpis, errorKpis }) {
  if (!kpis) return <Cargando error={errorKpis} />;
  if (kpis.latencia_promedio_ms === undefined) {
    return <p className="text-sm text-plum-soft">Esta sección es solo para el Super administrador.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SeccionTarjeta titulo="Pagos con Culqi">
        <div className="grid grid-cols-2 gap-4">
          <Dato label="Intentos" valor={kpis.total_intentos_pago} />
          <Dato
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
      </SeccionTarjeta>

      <SeccionTarjeta titulo="Rendimiento del servidor" nota="Últimas 24 horas">
        <div className="grid grid-cols-3 gap-4">
          <Dato label="Latencia prom." valor={kpis.latencia_promedio_ms != null ? `${kpis.latencia_promedio_ms} ms` : "—"} />
          <Dato label="Tasa de error" valor={kpis.tasa_error_24h != null ? `${kpis.tasa_error_24h}%` : "—"} />
          <Dato label="Requests" valor={kpis.total_requests_24h} />
        </div>
      </SeccionTarjeta>
    </div>
  );
}

function Tarjeta({ label, valor, destacar = false, small = false, detalle }) {
  return (
    <div className={`glass rounded-3xl shadow-glass ${small ? "p-5" : "p-6"} ${destacar ? "ring-2 ring-inset ring-gold" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-plum-soft">{label}</p>
      <p className={`mt-1 font-semibold text-plum ${small ? "text-lg" : "text-2xl"}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-plum-soft">{detalle}</p>}
    </div>
  );
}

function VentasChart({ datos, pie }) {
  const ancho = 560;
  const alto = 160;
  const max = Math.max(...datos.map((d) => d.total), 1);

  // Margen lateral dentro del dibujo para que los puntos de los extremos no se corten.
  const margen = 12;
  const puntos = datos.map((d, i) => {
    const x = margen + (i / (datos.length - 1)) * (ancho - margen * 2);
    const y = alto - (d.total / max) * (alto - 16) - 8;
    return { x, y, ...d };
  });

  const linea = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${margen},${alto} ${linea} ${ancho - margen},${alto}`;

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
      <div className="relative mt-2 h-4 text-xs text-plum-soft">
        {puntos.map((p) => (
          <span key={p.mes} className="absolute -translate-x-1/2" style={{ left: `${(p.x / ancho) * 100}%` }}>
            {p.mes}
          </span>
        ))}
      </div>
      {pie && <p className="mt-4 text-sm text-plum-soft">{pie}</p>}
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

function Embudo({ datos, titulo, nota, intro }) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);
  const sinDatos = datos.every((d) => d.cantidad === 0);

  return (
    <div className="glass rounded-3xl p-6 shadow-glass">
      {titulo && <h2 className="text-lg font-semibold text-plum">{titulo}</h2>}
      {nota && <p className="text-xs text-plum-soft">{nota}</p>}
      {intro && !sinDatos && <p className="mt-3 text-sm text-plum-soft">{intro}</p>}
      {sinDatos ? (
        <p className="mt-4 text-sm text-plum-soft">Todavía no hay suficientes eventos para calcular el embudo.</p>
      ) : (
        <div className="mt-4 space-y-3">
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
