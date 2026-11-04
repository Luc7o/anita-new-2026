import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { rutaAdmin } from "../../lib/appMode.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { PUEDE_REGISTRAR_COMPRAS } from "../../roles.js";
import { soles } from "../../formato.js";
import Paginador from "../../components/Paginador.jsx";
import { SkeletonFilasAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import BarraFiltros, { SelectFiltro, CampoFecha } from "../../components/admin/BarraFiltros.jsx";

const POR_PAGINA = 15;

export const fechaCorta = (iso) => {
  if (!iso) return "—";
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

export const ETIQUETA_DOCUMENTO = { factura: "Factura", boleta: "Boleta", guia: "Guía de remisión", otro: "Otro" };

export function InsigniaEstadoCompra({ estado }) {
  const anulada = estado === "anulada";
  return (
    <span
      className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${
        anulada ? "bg-plum/10 text-plum-soft" : "bg-berry/10 text-berry-dark"
      }`}
    >
      {anulada ? "Anulada" : "Recibida"}
    </span>
  );
}

export default function AdminCompras() {
  const toast = useToast();
  const { usuario } = useAuth();
  const puedeRegistrar = PUEDE_REGISTRAR_COMPRAS.includes(usuario?.rol);

  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState({ compras: [], total: 0, monto_comprado: 0 });
  const [cargando, setCargando] = useState(true);
  const pedido = useRef(0);

  useEffect(() => {
    api.adminProveedores().then(setProveedores).catch(() => {});
  }, []);

  // El buscador espera un instante después de escribir para no pedir datos en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const numero = ++pedido.current;
    setCargando(true);
    const params = { pagina, por_pagina: POR_PAGINA };
    if (busquedaAplicada) params.q = busquedaAplicada;
    if (proveedorId) params.proveedor_id = proveedorId;
    if (estado) params.estado = estado;
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    api
      .adminCompras(params)
      .then((r) => {
        if (numero === pedido.current) setDatos(r);
      })
      .catch((err) => {
        if (numero === pedido.current) toast.error(err.message || "No se pudieron cargar las compras");
      })
      .finally(() => {
        if (numero === pedido.current) setCargando(false);
      });
  }, [pagina, busquedaAplicada, proveedorId, estado, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
  };
  const hayFiltros = Boolean(busqueda || proveedorId || estado || desde || hasta);
  const limpiar = () => {
    setBusqueda("");
    setBusquedaAplicada("");
    setProveedorId("");
    setEstado("");
    setDesde("");
    setHasta("");
    setPagina(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-plum">Compras</h1>
          <p className="text-sm text-plum-soft">Mercadería que le compras a tus proveedores. Cada compra sube el stock.</p>
        </div>
        {puedeRegistrar && (
          <Link
            to={rutaAdmin("/compras/nueva")}
            className="rounded-[10px] bg-berry px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark"
          >
            + Nueva compra
          </Link>
        )}
      </div>

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por N.° de compra, documento o proveedor"
        hayFiltros={hayFiltros}
        onLimpiar={limpiar}
      >
        <SelectFiltro etiqueta="Proveedor" value={proveedorId} onChange={cambiar(setProveedorId)}>
          <option value="">Proveedor: Todos</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </SelectFiltro>
        <SelectFiltro etiqueta="Estado" value={estado} onChange={cambiar(setEstado)}>
          <option value="">Estado: Todos</option>
          <option value="recibida">Recibida</option>
          <option value="anulada">Anulada</option>
        </SelectFiltro>
        <CampoFecha etiqueta="Desde" value={desde} onChange={cambiar(setDesde)} max={hasta} />
        <CampoFecha etiqueta="Hasta" value={hasta} onChange={cambiar(setHasta)} min={desde} />
      </BarraFiltros>

      <p className="mb-2 text-sm text-plum-soft" aria-live="polite">
        Comprado (sin contar anuladas): <span className="font-semibold text-plum">{soles(datos.monto_comprado)}</span>
      </p>

      <Paginador pagina={pagina} porPagina={POR_PAGINA} total={datos.total} onCambiar={setPagina} className="mb-2" />

      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">N.°</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Registró</th>
            </tr>
          </thead>
          <tbody>
            {datos.compras.map((c) => (
              <tr key={c.id} className="border-t border-white/40">
                <td className="px-4 py-3">
                  <Link to={rutaAdmin(`/compras/${c.id}`)} className="font-medium text-berry hover:underline">
                    {c.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-plum-soft">{fechaCorta(c.fecha_compra)}</td>
                <td className="px-4 py-3 font-medium text-plum">{c.proveedor_nombre}</td>
                <td className="px-4 py-3 text-plum-soft">
                  {c.numero_documento
                    ? `${ETIQUETA_DOCUMENTO[c.tipo_documento] || "Doc."} ${c.numero_documento}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-plum">{soles(c.total)}</td>
                <td className="px-4 py-3">
                  <InsigniaEstadoCompra estado={c.estado} />
                </td>
                <td className="px-4 py-3 text-plum-soft">{c.registrada_por || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && <SkeletonFilasAdmin etiqueta="Cargando compras" />}
        {!cargando && datos.compras.length === 0 && (
          <p className="p-6 text-center text-plum-soft">
            {hayFiltros ? "No hay compras con esos filtros." : "Todavía no registraste compras."}
          </p>
        )}
      </div>

      {/* Tarjetas — solo móvil/tablet */}
      <div className="space-y-3 md:hidden">
        {datos.compras.map((c) => (
          <Link key={c.id} to={rutaAdmin(`/compras/${c.id}`)} className="glass block rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-plum">{c.proveedor_nombre}</p>
              <InsigniaEstadoCompra estado={c.estado} />
            </div>
            <p className="text-sm text-plum-soft">
              {c.numero} · {fechaCorta(c.fecha_compra)}
            </p>
            {c.numero_documento && (
              <p className="text-xs text-plum-soft">
                {ETIQUETA_DOCUMENTO[c.tipo_documento] || "Doc."} {c.numero_documento}
              </p>
            )}
            <p className="mt-1 text-sm font-semibold text-plum">{soles(c.total)}</p>
          </Link>
        ))}
        {cargando && <SkeletonFilasAdmin etiqueta="Cargando compras" />}
        {!cargando && datos.compras.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-plum-soft">
            {hayFiltros ? "No hay compras con esos filtros." : "Todavía no registraste compras."}
          </p>
        )}
      </div>
    </div>
  );
}
