import { rutaAdmin } from "../../lib/appMode.js";
import { SkeletonFilasAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import ErrorCarga from "../../components/ErrorCarga.jsx";
import { soles } from "../../formato.js";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { ESTADOS_PEDIDO, ENTREGAS_PEDIDO } from "./estadosPedido.js";
import { InsigniaEstadoPedido, InsigniaEntregaPedido, InsigniaEstadoPago } from "../../components/admin/InsigniasPedido.jsx";
import Paginador from "../../components/Paginador.jsx";
import BarraFiltros, { SelectFiltro, CampoFecha } from "../../components/admin/BarraFiltros.jsx";

const ESTADOS_PAGO = {
  verificado: "Pago verificado",
  en_revision: "En revisión",
  pendiente: "Pendiente",
  rechazado: "Pago rechazado",
  reembolso_pendiente: "Reembolso pendiente",
  reembolsando: "Reembolso en proceso",
  reembolsado: "Reembolsado",
  no_aplica: "No aplica",
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState(""); // búsqueda ya "asentada" (espera a que dejes de escribir)
  const [estado, setEstado] = useState("");
  // "" = todos; si no: delivery | recojo | mostrador (ver ENTREGAS_PEDIDO)
  const [entrega, setEntrega] = useState("");
  const [estadoPago, setEstadoPago] = useState("");
  const [orden, setOrden] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const POR_PAGINA = 10;

  // Espera un momento después de la última tecla antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => { setQ(busqueda.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const hayFiltros = Boolean(busqueda || estado || entrega || estadoPago || orden || desde || hasta);
  const limpiar = () => {
    setBusqueda(""); setQ(""); setEstado(""); setEntrega(""); setEstadoPago(""); setOrden(""); setDesde(""); setHasta(""); setPagina(1);
  };
  const cambiar = (setter) => (valor) => { setter(valor); setPagina(1); };

  const [errorCarga, setErrorCarga] = useState("");
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    // Descarta respuestas viejas si los filtros cambian antes de que lleguen.
    let vigente = true;
    setCargando(true);
    setErrorCarga("");
    const params = { pagina, por_pagina: POR_PAGINA };
    if (q) params.q = q;
    if (estado) params.estado = estado;
    if (entrega) params.entrega = entrega;
    if (estadoPago) params.estado_pago = estadoPago;
    if (orden) params.orden = orden;
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    api
      .adminPedidos(params)
      .then((data) => {
        if (!vigente) return;
        setPedidos(data.pedidos);
        setTotal(data.total);
      })
      .catch((err) => {
        // Antes un fallo mostraba "No hay pedidos con esos filtros", que era falso.
        if (vigente) setErrorCarga(err.message || "No se pudo cargar la lista de pedidos.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, [q, estado, entrega, estadoPago, orden, desde, hasta, pagina, reintento]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-plum">Pedidos</h1>
        <p className="text-sm text-plum-soft">Toca un pedido para ver su detalle y cambiar su estado.</p>
      </div>

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        placeholder="Buscar pedido o cliente"
        hayFiltros={hayFiltros}
        onLimpiar={limpiar}
      >
        <SelectFiltro etiqueta="Entrega" value={entrega} onChange={cambiar(setEntrega)}>
          <option value="">Entrega: Todas</option>
          {Object.entries(ENTREGAS_PEDIDO).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </SelectFiltro>
        <SelectFiltro etiqueta="Estado" value={estado} onChange={cambiar(setEstado)}>
          <option value="">Estado: Todos</option>
          {Object.entries(ESTADOS_PEDIDO).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </SelectFiltro>
        <SelectFiltro etiqueta="Pago" value={estadoPago} onChange={cambiar(setEstadoPago)}>
          <option value="">Pago: Todos</option>
          {Object.entries(ESTADOS_PAGO).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </SelectFiltro>
        <SelectFiltro etiqueta="Ordenar" value={orden} onChange={cambiar(setOrden)}>
          <option value="">Ordenar: Más recientes</option>
          <option value="antiguo">Más antiguos</option>
          <option value="total_desc">Total: mayor a menor</option>
          <option value="total_asc">Total: menor a mayor</option>
        </SelectFiltro>
        <CampoFecha etiqueta="Desde" value={desde} max={hasta} onChange={cambiar(setDesde)} />
        <CampoFecha etiqueta="Hasta" value={hasta} min={desde} onChange={cambiar(setHasta)} />
      </BarraFiltros>

      {cargando ? (
        <SkeletonFilasAdmin cantidad={6} etiqueta="Cargando pedidos" />
      ) : errorCarga ? (
        <ErrorCarga
          titulo="No se pudo cargar la lista de pedidos"
          mensaje={errorCarga}
          onReintentar={() => setReintento((n) => n + 1)}
        />
      ) : (
        <>
          <Paginador pagina={pagina} porPagina={POR_PAGINA} total={total} onCambiar={setPagina} className="mb-2" />
          {/* Tabla — solo desktop */}
          <div className="glass hidden overflow-x-auto rounded-2xl md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-plum-soft">
                <tr>
                  <th className="px-4 py-3">N° Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Entrega</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-t border-white/40">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-plum">{p.numero_pedido}</td>
                    <td className="px-4 py-3 text-plum-soft">
                      <span className="block max-w-56 truncate" title={p.cliente}>{p.cliente}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-plum-soft">
                      {new Date(p.fecha_creacion).toLocaleDateString("es-PE")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-plum-soft">{soles(p.total)}</td>
                    <td className="px-4 py-3">
                      <InsigniaEntregaPedido pedido={p} />
                    </td>
                    <td className="px-4 py-3">
                      <InsigniaEstadoPedido estado={p.estado} label={p.estado_label} />
                    </td>
                    <td className="px-4 py-3">
                      {p.estado_pago !== "no_aplica" && (
                        <InsigniaEstadoPago estado={p.estado_pago} label={p.estado_pago_label} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={rutaAdmin(`/pedidos/${p.id}`)} className="text-berry hover:underline">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pedidos.length === 0 && (
              <p className="p-6 text-center text-plum-soft">No hay pedidos con esos filtros.</p>
            )}
          </div>

          {/* Tarjetas — solo móvil/tablet */}
          <div className="space-y-3 md:hidden">
            {pedidos.map((p) => (
              <Link
                key={p.id}
                to={rutaAdmin(`/pedidos/${p.id}`)}
                className="glass block rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-plum">{p.numero_pedido}</p>
                    {/* Nombres largos sin espacios desbordaban la tarjeta y la página */}
                    <p className="line-clamp-2 text-sm text-plum-soft wrap-anywhere" title={p.cliente}>{p.cliente}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-berry-dark">
                    S/ {p.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-plum-soft">
                    {new Date(p.fecha_creacion).toLocaleDateString("es-PE")}
                  </span>
                  <InsigniaEntregaPedido pedido={p} />
                  <InsigniaEstadoPedido estado={p.estado} label={p.estado_label} />
                  {p.estado_pago !== "no_aplica" && (
                    <InsigniaEstadoPago estado={p.estado_pago} label={p.estado_pago_label} />
                  )}
                </div>
              </Link>
            ))}
            {pedidos.length === 0 && (
              <p className="glass rounded-2xl p-6 text-center text-plum-soft">
                No hay pedidos con esos filtros.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
