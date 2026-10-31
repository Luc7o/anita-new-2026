import { rutaAdmin } from "../../lib/appMode.js";
import { SkeletonPanelAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { soles } from "../../formato.js";
import { IconChevronDown } from "../../components/Icons.jsx";
import { InsigniaEstadoPedido } from "../../components/admin/InsigniasPedido.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { SUPERADMIN, PUEDE_VER_DASHBOARD } from "../../roles.js";


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
const ROLES_CON_ESTADISTICAS = ["superadmin", "administrativo", "ventas", "almacen"];

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
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
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
    <p role="alert" className="glass rounded-2xl p-6 text-sm text-red-700">{textoError}</p>
  ) : (
    <SkeletonPanelAdmin etiqueta="Cargando métricas" />
  );
}

// Todo el texto del dashboard vive dentro de tarjetas con el mismo margen
// interior (p-6), así títulos, notas y cifras arrancan en la misma línea.
function SeccionTarjeta({ titulo, nota, children }) {
  return (
    <div className="glass rounded-2xl p-6">
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
      <div className="glass rounded-2xl p-6">
        <p className="font-semibold text-plum">Todo al día ✓</p>
        <p className="text-sm text-plum-soft">No tienes nada pendiente por atender ahora mismo.</p>
      </div>
    );
  }
  return (
    <section aria-labelledby="atencion-titulo" className="glass rounded-2xl p-6">
      <h2 id="atencion-titulo" className="text-lg font-semibold text-plum">Necesita tu atención</h2>
      <ul className="mt-3 divide-y divide-plum/10">
        {items.map((it) => (
          <li key={it.clave}>
            <Link to={rutaAdmin(String(it.enlace || "").replace(/^\/admin(?=\/|$)/, ""))} className="flex items-center justify-between gap-3 py-2.5 text-sm transition hover:text-berry">
              <span className="flex items-center gap-2 text-plum">
                {it.urgente && (
                  <span className="rounded-md bg-gold/30 px-2 py-0.5 text-xs font-semibold text-plum">Urgente</span>
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

            {(stats.pedidos_recientes || stats.productos_top) && (
              <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
                {stats.pedidos_recientes && <PedidosRecientes datos={stats.pedidos_recientes} />}
                {stats.productos_top && <ProductosTop datos={stats.productos_top} />}
              </div>
            )}
          </>
        ))}

      <div className="flex flex-wrap gap-3">
        <Link
          to={rutaAdmin("/productos")}
          className="rounded-[10px] bg-berry px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark"
        >
          Gestionar productos
        </Link>
        <Link
          to={rutaAdmin("/pedidos")}
          className="glass rounded-[10px] px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-white"
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
      <PanelVentasPeriodo />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Tarjeta label="Ventas confirmadas" valor={soles(stats.ventas_confirmadas)} detalle="Total desde que abriste la tienda" />
        <Tarjeta label="Pedidos" valor={stats.total_pedidos} />
        {stats.total_clientes !== undefined && <Tarjeta label="Clientes registrados" valor={stats.total_clientes} />}
      </div>

      {hayDetalleFinanciero && (
        <div className="glass rounded-2xl p-6">
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


// ------------------------------------------------- Ventas por periodo
const fechaISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function rangoDeMes(anio, mes0) {
  return { desde: fechaISO(new Date(anio, mes0, 1)), hasta: fechaISO(new Date(anio, mes0 + 1, 0)) };
}

function presetsDeVentas() {
  const hoy = new Date();
  const a = hoy.getFullYear();
  const m = hoy.getMonth();
  return [
    { id: "mes", label: "Este mes", rango: rangoDeMes(a, m) },
    { id: "mes_anterior", label: "Mes anterior", rango: rangoDeMes(a, m - 1) },
    { id: "3m", label: "Últimos 3 meses", rango: { desde: fechaISO(new Date(a, m - 2, 1)), hasta: fechaISO(hoy) } },
    { id: "anio", label: "Este año", rango: { desde: `${a}-01-01`, hasta: fechaISO(hoy) } },
    { id: "todo", label: "Total histórico", rango: { desde: "", hasta: "" } },
  ];
}

function PanelVentasPeriodo() {
  const presets = useMemo(presetsDeVentas, []);
  const [activo, setActivo] = useState("mes");
  const [mesSel, setMesSel] = useState("");
  const [anioSel, setAnioSel] = useState(new Date().getFullYear());
  const [desdeP, setDesdeP] = useState("");
  const [hastaP, setHastaP] = useState("");
  const [rango, setRango] = useState(presets[0].rango);
  const [datos, setDatos] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState(false);
  const pedido = useRef(0);

  useEffect(() => {
    const id = ++pedido.current;
    setCargandoDatos(true);
    setError("");
    api
      .adminVentasPeriodo(rango)
      .then((d) => { if (id === pedido.current) setDatos(d); })
      .catch((err) => { if (id === pedido.current) setError(err.message || "No se pudieron cargar las ventas."); })
      .finally(() => { if (id === pedido.current) setCargandoDatos(false); });
  }, [rango]);

  const elegirPreset = (p) => {
    setActivo(p.id);
    setMesSel("");
    setRango(p.rango);
  };

  const elegirMes = (mes, anio) => {
    setMesSel(mes);
    setAnioSel(anio);
    if (mes === "") return;
    setActivo("mes_elegido");
    setRango(rangoDeMes(Number(anio), Number(mes)));
  };

  const aplicarPersonalizado = (d, h) => {
    setActivo("personalizado");
    setMesSel("");
    if (d && h && d <= h) setRango({ desde: d, hasta: h });
  };

  const descargar = async () => {
    setDescargando(true);
    try {
      await api.adminReporteVentas(rango.desde, rango.hasta);
    } finally {
      setDescargando(false);
    }
  };

  const titulo = (() => {
    if (activo === "todo") return "Ventas totales (desde que abriste la tienda)";
    if (rango.desde && rango.hasta) return `Ventas del ${rango.desde} al ${rango.hasta}`;
    return "Ventas del periodo";
  })();

  const chip = (sel) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${sel ? "bg-berry text-white" : "bg-white text-plum hover:bg-berry/10"}`;
  const entrada = "rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/30 hover:ring-plum/50 focus:outline-none focus:ring-2 focus:ring-berry/60";
  const entradaActiva = "!ring-2 !ring-berry";
  const hoyD = new Date();
  const anioActual = hoyD.getFullYear();
  const aniosDisponibles = Array.from({ length: 6 }, (_, i) => anioActual - i);
  const mesesDisponibles = MESES.map((n, i) => ({ n, i })).filter(({ i }) => Number(anioSel) < anioActual || i <= hoyD.getMonth());

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-plum">Ventas por periodo</h2>
          <p className="text-xs text-plum-soft">Elige un mes, un rango de fechas o el total histórico. Solo ventas confirmadas.</p>
        </div>
        <button
          type="button"
          onClick={descargar}
          disabled={descargando || !datos || datos.pedidos === 0}
          className="rounded-[10px] bg-white px-4 py-2 text-sm font-semibold text-berry ring-1 ring-berry/30 transition hover:bg-berry/5 disabled:opacity-50"
        >
          {descargando ? "Generando…" : "Descargar reporte PDF"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <button key={p.id} type="button" onClick={() => elegirPreset(p)} aria-pressed={activo === p.id} className={chip(activo === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <fieldset>
          <legend className="text-xs text-plum-soft">Elegir un mes</legend>
          <div className="mt-1 flex gap-2">
            <select
              aria-label="Mes"
              value={mesSel}
              onChange={(e) => elegirMes(e.target.value, anioSel)}
              className={`${entrada} ${activo === "mes_elegido" ? entradaActiva : ""} min-w-[8.5rem] cursor-pointer`}
            >
              <option value="">Mes…</option>
              {mesesDisponibles.map(({ n, i }) => (
                <option key={i} value={i}>{n}</option>
              ))}
            </select>
            <select
              aria-label="Año"
              value={anioSel}
              onChange={(e) => {
                const a = Number(e.target.value);
                const mesSigueValido = mesSel !== "" && (a < anioActual || Number(mesSel) <= hoyD.getMonth());
                if (mesSel === "" || mesSigueValido) elegirMes(mesSel, a);
                else { elegirPreset(presets[0]); setAnioSel(a); }
              }}
              className={`${entrada} ${activo === "mes_elegido" ? entradaActiva : ""} cursor-pointer`}
            >
              {aniosDisponibles.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </fieldset>
        <label className="text-xs text-plum-soft">
          Desde
          <input type="date" value={desdeP} max={hastaP || undefined} className={`mt-1 block ${entrada} ${activo === "personalizado" ? entradaActiva : ""}`} onChange={(e) => { setDesdeP(e.target.value); aplicarPersonalizado(e.target.value, hastaP); }} />
        </label>
        <label className="text-xs text-plum-soft">
          Hasta
          <input type="date" value={hastaP} min={desdeP || undefined} className={`mt-1 block ${entrada} ${activo === "personalizado" ? entradaActiva : ""}`} onChange={(e) => { setHastaP(e.target.value); aplicarPersonalizado(desdeP, e.target.value); }} />
        </label>
      </div>

      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      ) : !datos ? (
        <p className="text-sm text-plum-soft">Cargando ventas…</p>
      ) : (
        <div className={`space-y-6 transition ${cargandoDatos ? "opacity-60" : ""}`} aria-busy={cargandoDatos}>
          <p className="text-xs uppercase tracking-wide text-plum-soft">{titulo}</p>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Tarjeta label="Ventas" valor={soles(datos.total)} destacar />
            <Tarjeta label="Pedidos" valor={datos.pedidos} />
            <Tarjeta label="Ticket promedio" valor={soles(datos.ticket_promedio)} />
            {datos.por_origen.map((o) => (
              <Tarjeta key={o.origen} label={o.label} valor={soles(o.total)} />
            ))}
          </div>

          {datos.pedidos === 0 ? (
            <p className="text-sm text-plum-soft">No hay ventas confirmadas en este periodo.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              {datos.por_mes.length > 1 ? (
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-plum">Ventas por mes</h2>
                  <p className="text-xs text-plum-soft">Ventas confirmadas de cada mes del periodo</p>
                  <GraficoBarras
                    datos={datos.por_mes.map((m) => ({ etiqueta: m.etiqueta, valor: m.total }))}
                    resumen={`Ventas por mes. Mejor mes: ${datos.mejor_mes?.etiqueta ?? ""}`}
                  />
                  {datos.mejor_mes && (
                    <p className="mt-2 text-xs text-plum-soft">
                      Mejor mes: <strong className="text-plum">{datos.mejor_mes.etiqueta}</strong> con {soles(datos.mejor_mes.total)}.
                    </p>
                  )}
                </div>
              ) : (
                <BarrasHorizontales
                  titulo="Ventas por canal"
                  subtitulo="Compras en línea y ventas en tienda"
                  vacioTexto="Sin ventas en este periodo."
                  datos={datos.por_origen.map((o) => ({ label: o.label, valor: o.total, formato: (v) => soles(v) }))}
                />
              )}
              <BarrasHorizontales
                titulo="Por método de pago"
                subtitulo="Cuánto se cobró con cada uno"
                vacioTexto="Sin ventas en este periodo."
                datos={datos.por_metodo.map((m) => ({
                  label: m.label,
                  valor: m.total,
                  formato: (v) => soles(v),
                  detalle: `${m.pedidos} pedido${m.pedidos === 1 ? "" : "s"}`,
                }))}
              />
            </div>
          )}
        </div>
      )}
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
      <GrupoKpis titulo="Visitas" nota="Cuánta gente entra a tu tienda" columnas="grid-cols-1 sm:grid-cols-3">
        <Tarjeta label="Visitas hoy" valor={stats.visitas_hoy} />
        <Tarjeta label="Personas hoy" valor={stats.visitantes_hoy} />
        <Tarjeta label="Personas (7 días)" valor={stats.visitantes_7dias} />
      </GrupoKpis>

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

          <GrupoKpis titulo="Carritos abandonados" nota="Productos que siguen en el carrito ahora mismo, sin comprar" columnas="grid-cols-1 sm:grid-cols-2">
            <Tarjeta label="Llevan más de 2 días" valor={kpis.carritos_abandonados_48h} destacar={kpis.carritos_abandonados_48h > 0} />
            <Tarjeta
              label="Antigüedad promedio"
              valor={kpis.antiguedad_promedio_carrito_horas != null ? `${kpis.antiguedad_promedio_carrito_horas} h` : "—"}
            />
          </GrupoKpis>
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
        <GrupoKpis titulo="¿Cuánto demoramos?" nota="Promedio desde que el cliente hace el pedido" columnas="grid-cols-2">
          <Tarjeta label="Hasta el pago" valor={kpis.tiempo_pago_promedio_horas != null ? `${kpis.tiempo_pago_promedio_horas} h` : "—"} />
          <Tarjeta label="Hasta la entrega" valor={kpis.tiempo_entrega_promedio_horas != null ? `${kpis.tiempo_entrega_promedio_horas} h` : "—"} />
        </GrupoKpis>

        <BarrasHorizontales
          titulo="Tiempo en cada paso del pedido"
          subtitulo="Promedio entre un estado y el siguiente"
          vacioTexto="Todavía no hay suficientes cambios de estado."
          datos={kpis.tiempos_entre_estados.map((t) => ({ label: t.transicion, valor: t.horas_promedio, formato: (v) => `${v} h` }))}
        />
      </div>

      <BarrasHorizontales
        titulo="¿Por qué se cancelan los pedidos?"
        vacioTexto="Todavía no hay pedidos cancelados."
        datos={kpis.motivos_cancelacion.map((m) => ({ label: m.motivo, valor: m.cantidad }))}
      />

      <GrupoKpis titulo="Stock" nota="Últimos 30 días">
        <Tarjeta label="Unidades vendidas" valor={kpis.unidades_vendidas_30d} />
        <Tarjeta label="Unidades devueltas al stock" valor={kpis.unidades_restauradas_30d} />
        <Tarjeta label="Productos sin stock" valor={kpis.productos_sin_stock} destacar={kpis.productos_sin_stock > 0} />
      </GrupoKpis>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GrupoKpis titulo="Pagos con Culqi" nota="Intentos de pago con tarjeta" columnas="grid-cols-2">
          <Tarjeta label="Intentos" valor={kpis.total_intentos_pago} />
          <Tarjeta
            label="Tasa de rechazo"
            valor={kpis.tasa_rechazo_pago != null ? `${kpis.tasa_rechazo_pago}%` : "—"}
            destacar={kpis.tasa_rechazo_pago > 20}
          />
        </GrupoKpis>

        <GrupoKpis titulo="Rendimiento del servidor" nota="Últimas 24 horas" columnas="grid-cols-3">
          <Tarjeta small label="Latencia prom." valor={kpis.latencia_promedio_ms != null ? `${kpis.latencia_promedio_ms} ms` : "—"} />
          <Tarjeta small label="Tasa de error" valor={kpis.tasa_error_24h != null ? `${kpis.tasa_error_24h}%` : "—"} />
          <Tarjeta small label="Requests" valor={kpis.total_requests_24h} />
        </GrupoKpis>
      </div>

      {kpis.motivos_rechazo_pago.length > 0 && (
        <BarrasHorizontales
          titulo="¿Por qué se rechazan los pagos?"
          vacioTexto=""
          datos={kpis.motivos_rechazo_pago.map((m) => ({ label: m.motivo, valor: m.cantidad }))}
        />
      )}
    </div>
  );
}

// Título + fila de tarjetas de indicadores (cada indicador en su propia tarjeta).
function GrupoKpis({ titulo, nota, columnas = "grid-cols-2 sm:grid-cols-3", children, extra }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {nota && <p className="text-xs text-plum-soft">{nota}</p>}
      <div className={`mt-3 grid gap-4 ${columnas}`}>{children}</div>
      {extra}
    </section>
  );
}

function Tarjeta({ label, valor, destacar = false, small = false, detalle }) {
  return (
    <div className={`glass rounded-2xl ${small ? "p-5" : "p-6"} ${destacar ? "ring-2 ring-inset ring-gold" : ""}`}>
      <p className="text-xs uppercase tracking-wide text-plum-soft">{label}</p>
      <p className={`mt-1 font-semibold text-plum ${small ? "text-lg" : "text-2xl"}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-plum-soft">{detalle}</p>}
    </div>
  );
}

// Tope "redondo" para el eje vertical (100, 200, 400, 500, 800, 1000...), con 4 divisiones parejas.
function topeEje(max) {
  if (max <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(max));
  const multiplo = [1, 2, 4, 5, 8, 10].find((m) => m * p >= max) || 10;
  return multiplo * p;
}

const etiquetaEje = (n) => (n >= 1000 ? `${n / 1000}k` : `${n}`);

// Gráfico de barras con eje, líneas guía y el valor más alto destacado.
function GraficoBarras({ datos, resumen }) {
  const ancho = 640;
  const alto = 260;
  const mIzq = 58;
  const mDer = 16;
  const mSup = 38;
  const mInf = 34;
  const max = Math.max(...datos.map((d) => d.valor), 0);
  const tope = topeEje(max);
  const anchoUtil = ancho - mIzq - mDer;
  const altoUtil = alto - mSup - mInf;
  const paso = anchoUtil / datos.length;
  const anchoBarra = Math.min(48, paso * 0.58);
  const yDe = (v) => mSup + (1 - v / tope) * altoUtil;
  const iMejor = datos.reduce((m, d, i) => (d.valor > datos[m].valor ? i : m), 0);
  const corta = (e) => (datos.length > 8 ? String(e).split(" ")[0] : e);

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="mt-4 h-auto w-full" role="img" aria-label={resumen}>
      {[0, 1, 2, 3, 4].map((k) => {
        const valor = (tope / 4) * k;
        const y = yDe(valor);
        return (
          <g key={k}>
            <line x1={mIzq} x2={ancho - mDer} y1={y} y2={y} className="stroke-plum/15" strokeDasharray={k ? "3 5" : undefined} />
            <text x={mIzq - 10} y={y + 4} textAnchor="end" fontSize="11" className="fill-plum-soft">
              {k ? `S/ ${etiquetaEje(valor)}` : "0"}
            </text>
          </g>
        );
      })}
      {datos.map((d, i) => {
        const x = mIzq + i * paso + (paso - anchoBarra) / 2;
        const y = yDe(d.valor);
        const h = yDe(0) - y;
        const r = Math.min(6, anchoBarra / 2, h);
        const mejor = i === iMejor;
        return (
          <g key={d.etiqueta}>
            <title>{`${d.etiqueta}: ${soles(d.valor)}`}</title>
            {h > 0 && (
              <path
                d={`M${x} ${y + r} Q${x} ${y} ${x + r} ${y} H${x + anchoBarra - r} Q${x + anchoBarra} ${y} ${x + anchoBarra} ${y + r} V${yDe(0)} H${x} Z`}
                className={mejor ? "fill-berry" : "fill-berry/45"}
              />
            )}
            <text x={x + anchoBarra / 2} y={alto - 10} textAnchor="middle" fontSize="11" fontWeight={mejor ? 700 : 400} className={mejor ? "fill-plum" : "fill-plum-soft"}>
              {corta(d.etiqueta)}
            </text>
          </g>
        );
      })}
      {datos[iMejor] && datos[iMejor].valor > 0 && (() => {
        const d = datos[iMejor];
        const texto = `S/ ${Math.round(d.valor).toLocaleString("es-PE")}`;
        const w = 20 + texto.length * 7.2;
        const cx = mIzq + iMejor * paso + paso / 2;
        const x = Math.min(Math.max(cx - w / 2, mIzq), ancho - mDer - w);
        const y = yDe(d.valor) - 32;
        return (
          <g>
            <rect x={x} y={y} width={w} height="22" rx="6" className="fill-plum" />
            <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ivory">{texto}</text>
          </g>
        );
      })()}
    </svg>
  );
}

function VentasChart({ datos, pie }) {
  const ancho = 640;
  const alto = 270;
  const mIzq = 52;
  const mDer = 26;
  const mSup = 36;
  const mInf = 34;
  const max = Math.max(...datos.map((d) => d.total), 0);
  const tope = topeEje(max);
  const anchoUtil = ancho - mIzq - mDer;
  const altoUtil = alto - mSup - mInf;
  const xDe = (i) => (datos.length > 1 ? mIzq + (i / (datos.length - 1)) * anchoUtil : mIzq + anchoUtil / 2);
  const yDe = (v) => mSup + (1 - v / tope) * altoUtil;

  const puntos = datos.map((d, i) => ({ x: xDe(i), y: yDe(d.total), ...d }));
  const iMejor = puntos.reduce((mejor, p, i) => (p.total > puntos[mejor].total ? i : mejor), 0);

  // Curva suave que nunca baja del eje (las tangentes son horizontales en cada punto).
  let linea = `M${puntos[0]?.x ?? 0} ${puntos[0]?.y ?? 0}`;
  for (let i = 1; i < puntos.length; i++) {
    const medio = (puntos[i - 1].x + puntos[i].x) / 2;
    linea += ` C${medio} ${puntos[i - 1].y} ${medio} ${puntos[i].y} ${puntos[i].x} ${puntos[i].y}`;
  }
  const area = `${linea} L${puntos[puntos.length - 1]?.x ?? 0} ${yDe(0)} L${puntos[0]?.x ?? 0} ${yDe(0)} Z`;

  const mejor = puntos[iMejor];
  const etiqueta = mejor ? `S/ ${Math.round(mejor.total).toLocaleString("es-PE")}` : "";
  const anchoEtiqueta = 18 + etiqueta.length * 7.4;
  const xEtiqueta = mejor ? Math.min(Math.max(mejor.x - anchoEtiqueta / 2, mIzq), ancho - mDer - anchoEtiqueta) : 0;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-plum">Ventas de los últimos 6 meses</h2>
      <p className="text-xs text-plum-soft">Ventas confirmadas por mes</p>

      {max <= 0 ? (
        <p className="mt-8 text-sm text-plum-soft">Todavía no hay suficientes ventas confirmadas para graficar.</p>
      ) : (
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          className="mt-4 h-auto w-full"
          role="img"
          aria-label={`Ventas por mes. Mejor mes: ${mejor.mes} con ${etiqueta}`}
        >
          <defs>
            <linearGradient id="ventas-relleno" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "rgb(var(--c-berry))", stopOpacity: 0.28 }} />
              <stop offset="1" style={{ stopColor: "rgb(var(--c-berry))", stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {/* Líneas guía y montos del eje vertical */}
          {[0, 1, 2, 3, 4].map((k) => {
            const valor = (tope / 4) * k;
            const y = yDe(valor);
            return (
              <g key={k}>
                <line x1={mIzq} x2={ancho - mDer} y1={y} y2={y} className="stroke-plum/15" strokeDasharray={k ? "3 5" : undefined} />
                <text x={mIzq - 10} y={y + 4} textAnchor="end" fontSize="11" className="fill-plum-soft">
                  {etiquetaEje(valor)}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#ventas-relleno)" />
          <path d={linea} fill="none" className="stroke-berry" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {puntos.map((p, i) => (
            <g key={p.mes}>
              <title>{`${p.mes}: S/ ${p.total.toFixed(2)}`}</title>
              {i === iMejor ? (
                <circle cx={p.x} cy={p.y} r="7" className="fill-berry stroke-white" strokeWidth="3" />
              ) : (
                <circle cx={p.x} cy={p.y} r="4.5" className="fill-white stroke-berry" strokeWidth="2.5" />
              )}
              <text
                x={p.x}
                y={alto - 10}
                textAnchor="middle"
                fontSize="12"
                fontWeight={i === iMejor ? 700 : 400}
                className={i === iMejor ? "fill-plum" : "fill-plum-soft"}
              >
                {p.mes}
              </text>
            </g>
          ))}

          {/* Etiqueta con el monto del mejor mes */}
          <rect x={xEtiqueta} y={mejor.y - 36} width={anchoEtiqueta} height="24" rx="6" className="fill-plum" />
          <text x={xEtiqueta + anchoEtiqueta / 2} y={mejor.y - 20} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-ivory">
            {etiqueta}
          </text>
        </svg>
      )}
      {pie && <p className="mt-2 text-sm text-plum-soft">{pie}</p>}
    </div>
  );
}

function VisitasChart({ datos }) {
  const max = Math.max(...datos.map((d) => d.visitas), 1);
  const sinDatos = datos.every((d) => d.visitas === 0);
  const tope = topeEje(max);

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-plum">Visitas de los últimos 7 días</h2>
      <p className="text-xs text-plum-soft">Vistas de página totales, visitantes únicos superpuestos</p>

      {sinDatos ? (
        <p className="mt-8 text-sm text-plum-soft">Todavía no hay visitas registradas.</p>
      ) : (
        <div className="mt-6 flex gap-2">
          {/* Eje vertical */}
          <div className="flex h-28 flex-col justify-between pr-1 text-right text-[11px] text-plum-soft">
            <span>{etiquetaEje(tope)}</span>
            <span>{etiquetaEje(tope / 2)}</span>
            <span>0</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-28">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                <span className="border-t border-dashed border-plum/15" />
                <span className="border-t border-dashed border-plum/15" />
                <span className="border-t border-plum/15" />
              </div>
              <div className="relative flex h-full items-end justify-between gap-2">
                {datos.map((d) => (
                  <div key={d.dia} className="relative flex h-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[34px] rounded-t-lg bg-berry/30"
                      style={{ height: `${Math.max((d.visitas / tope) * 100, d.visitas > 0 ? 4 : 0)}%` }}
                      title={`${d.visitas} visitas`}
                    />
                    <div
                      className="absolute bottom-0 w-full max-w-[34px] rounded-t-lg bg-berry"
                      style={{ height: `${Math.max((d.visitantes / tope) * 100, d.visitantes > 0 ? 4 : 0)}%` }}
                      title={`${d.visitantes} visitantes únicos`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between gap-2">
              {datos.map((d) => (
                <span key={d.dia} className="flex-1 text-center text-xs text-plum-soft">
                  {d.dia}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Embudo({ datos, titulo, nota, intro }) {
  const max = Math.max(...datos.map((d) => d.cantidad), 1);
  const sinDatos = datos.every((d) => d.cantidad === 0);

  return (
    <div className="glass rounded-2xl p-6">
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
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-plum/10">
                <div
                  className={`h-full rounded-full ${i === datos.length - 1 ? "bg-plum" : "bg-berry"}`}
                  style={{
                    width: `${Math.max((paso.cantidad / max) * 100, paso.cantidad > 0 ? 3 : 0)}%`,
                    opacity: i === datos.length - 1 ? 1 : 1 - i * 0.16,
                  }}
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
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {subtitulo && <p className="text-xs text-plum-soft">{subtitulo}</p>}

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">{vacioTexto}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {datos.map((d, i) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="min-w-0 truncate text-plum">{d.label}</span>
                <span className="shrink-0 font-semibold text-plum-soft">
                  {d.formato ? d.formato(d.valor) : d.valor}
                  {d.detalle && <span className="ml-1.5 text-xs font-normal text-plum-soft/70">· {d.detalle}</span>}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-plum/10">
                <div className="h-full rounded-full bg-berry" style={{ width: `${Math.max((d.valor / max) * 100, 3)}%`, opacity: i === 0 ? 1 : 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopCategorias({ datos }) {
  return (
    <BarrasHorizontales
      titulo="Categorías más vendidas"
      subtitulo="Por unidades vendidas"
      vacioTexto="Todavía no hay ventas para calcular esto."
      datos={datos.map((d) => ({ label: d.nombre, valor: d.porcentaje, formato: (v) => `${v}%` }))}
    />
  );
}

function PedidosRecientes({ datos }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-plum">Pedidos recientes</h2>
        <Link to={rutaAdmin("/pedidos")} className="text-sm font-semibold text-berry-dark hover:underline">
          Ver todos
        </Link>
      </div>

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">Todavía no hay pedidos.</p>
      ) : (
        <div className="mt-3 divide-y divide-plum/10">
          {datos.map((p) => (
            <div key={p.numero_pedido} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-plum">{p.numero_pedido}</p>
                <p className="truncate text-xs text-plum-soft">{p.cliente} · {p.producto_resumen}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-plum">S/ {p.total.toFixed(2)}</span>
                <InsigniaEstadoPedido estado={p.estado} label={p.estado_label} />
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
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-plum">Productos más vendidos</h2>

      {datos.length === 0 ? (
        <p className="mt-4 text-sm text-plum-soft">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="mt-3 divide-y divide-plum/10">
          {datos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-3">
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
