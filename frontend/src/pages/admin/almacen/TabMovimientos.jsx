import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../../api/client.js";
import { rutaAdmin } from "../../../lib/appMode.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { PUEDE_VER_PEDIDOS, PUEDE_VER_COMPRAS } from "../../../roles.js";
import { soles } from "../../../formato.js";
import Paginador from "../../../components/Paginador.jsx";
import { SkeletonFilasAdmin } from "../../../components/admin/EsqueletosAdmin.jsx";
import { SelectFiltro, CampoFecha } from "../../../components/admin/BarraFiltros.jsx";
import Spinner from "../../../components/Spinner.jsx";
import { IconSearch, IconClose } from "../../../components/Icons.jsx";
import { textoVariante } from "./TabStock.jsx";

const POR_PAGINA = 20;

const campo =
  "w-full rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 hover:ring-plum/40 focus:outline-none focus:ring-2 focus:ring-berry";

// El servidor manda la hora en UTC sin zona: se le agrega para mostrarla en hora local.
const fechaHora = (iso) => {
  if (!iso) return "—";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
};

export default function TabMovimientos() {
  const toast = useToast();
  const { usuario } = useAuth();
  const [params] = useSearchParams();
  const puedeVerPedidos = PUEDE_VER_PEDIDOS.includes(usuario?.rol);
  const puedeVerCompras = PUEDE_VER_COMPRAS.includes(usuario?.rol);

  // Producto elegido (kardex de un producto). Puede venir en la dirección desde la pantalla de Stock.
  const [producto, setProducto] = useState(null); // { id, nombre, sku, variantes: [{id, talla, color}] }
  const [varianteId, setVarianteId] = useState("");
  const [tipo, setTipo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [orden, setOrden] = useState("desc");
  const [pagina, setPagina] = useState(1);

  const [tipos, setTipos] = useState([]);
  const [datos, setDatos] = useState({ movimientos: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const pedido = useRef(0);

  // Buscador de producto
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const pedidoBusqueda = useRef(0);
  const [descargando, setDescargando] = useState(false);

  const elegirProducto = (p) => {
    setProducto({ id: p.id, nombre: p.nombre, sku: p.sku, variantes: p.variantes || [] });
    setVarianteId("");
    setBusqueda("");
    setResultados([]);
    setOrden("asc"); // el kardex se lee de más antiguo a más reciente
    setPagina(1);
  };

  useEffect(() => {
    const id = params.get("producto_id");
    if (!id) return;
    api
      .adminProducto(id)
      .then((p) => elegirProducto({ id: p.id, nombre: p.nombre, sku: p.sku, variantes: p.variantes }))
      .catch(() => toast.error("No se encontró ese producto"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const texto = busqueda.trim();
    if (texto.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const numero = ++pedidoBusqueda.current;
    const t = setTimeout(() => {
      api
        .adminProductos({ q: texto, por_pagina: 6 })
        .then((r) => {
          if (numero === pedidoBusqueda.current) setResultados(r.productos || []);
        })
        .catch(() => {})
        .finally(() => {
          if (numero === pedidoBusqueda.current) setBuscando(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const numero = ++pedido.current;
    setCargando(true);
    const p = { pagina, por_pagina: POR_PAGINA, orden };
    if (producto) p.producto_id = producto.id;
    if (varianteId) p.variante_id = varianteId;
    if (tipo) p.tipo = tipo;
    if (desde) p.desde = desde;
    if (hasta) p.hasta = hasta;
    api
      .adminMovimientos(p)
      .then((r) => {
        if (numero !== pedido.current) return;
        setDatos(r);
        if (r.tipos) setTipos(r.tipos);
      })
      .catch((err) => {
        if (numero === pedido.current) toast.error(err.message || "No se pudieron cargar los movimientos");
      })
      .finally(() => {
        if (numero === pedido.current) setCargando(false);
      });
  }, [pagina, producto, varianteId, tipo, desde, hasta, orden]); // eslint-disable-line react-hooks/exhaustive-deps

  const reiniciar = (setter) => (v) => {
    setter(v);
    setPagina(1);
  };
  const quitarProducto = () => {
    setProducto(null);
    setVarianteId("");
    setOrden("desc");
    setPagina(1);
  };

  const descargarKardex = async () => {
    setDescargando(true);
    try {
      await api.adminReporteKardex({
        productoId: producto.id,
        varianteId: varianteId || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        sku: producto.sku,
      });
    } catch (err) {
      toast.error(err.message || "No se pudo generar el kardex");
    } finally {
      setDescargando(false);
    }
  };

  const referencia = (m) => (
    <>
      {m.motivo && <span>{m.motivo}</span>}
      {m.pedido_id && (puedeVerPedidos ? (
        <Link to={rutaAdmin(`/pedidos/${m.pedido_id}`)} className="ml-1 text-berry hover:underline">Pedido #{m.pedido_id}</Link>
      ) : (
        <span className="ml-1">Pedido #{m.pedido_id}</span>
      ))}
      {m.compra_id && puedeVerCompras && (
        <Link to={rutaAdmin(`/compras/${m.compra_id}`)} className="ml-1 text-berry hover:underline">Ver compra</Link>
      )}
    </>
  );

  return (
    <div>
      <div className="mb-4">
        {producto ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-berry/10 px-4 py-1.5 text-sm font-semibold text-berry-dark">
              Kardex de {producto.nombre}
              <button type="button" onClick={quitarProducto} aria-label="Quitar el producto elegido" className="hover:text-berry">
                <IconClose size={14} />
              </button>
            </span>
            <button
              type="button"
              onClick={descargarKardex}
              disabled={descargando}
              className="inline-flex items-center rounded-[10px] bg-white px-4 py-1.5 text-sm font-semibold text-berry ring-1 ring-berry/40 transition hover:bg-berry/10 disabled:opacity-60"
            >
              {descargando && <Spinner />}
              Descargar kardex (PDF)
            </button>
            {producto.variantes.length > 0 && (
              <SelectFiltro etiqueta="Talla y color" value={varianteId} onChange={reiniciar(setVarianteId)}>
                <option value="">Todas las tallas y colores</option>
                {producto.variantes.map((v) => (
                  <option key={v.id} value={v.id}>{textoVariante(v) || "Única"}</option>
                ))}
              </SelectFiltro>
            )}
          </div>
        ) : (
          <div className="relative max-w-xl">
            <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum-soft" />
            <input
              type="search"
              aria-label="Buscar un producto para ver su kardex"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busca un producto para ver su kardex (nombre o SKU)"
              className={`${campo} pl-9`}
            />
            {busqueda.trim().length >= 2 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-glass-lg ring-1 ring-plum/10" aria-live="polite">
                {buscando && <li className="px-4 py-2 text-sm text-plum-soft">Buscando…</li>}
                {!buscando && resultados.length === 0 && <li className="px-4 py-2 text-sm text-plum-soft">No se encontró ningún producto.</li>}
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => elegirProducto(p)} className="block w-full px-4 py-2 text-left text-sm text-plum hover:bg-berry/10">
                      {p.nombre} <span className="text-xs text-plum-soft">{p.sku}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SelectFiltro etiqueta="Tipo de movimiento" value={tipo} onChange={reiniciar(setTipo)}>
          <option value="">Tipo: Todos</option>
          {tipos.map((t) => (
            <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
          ))}
        </SelectFiltro>
        <CampoFecha etiqueta="Desde" value={desde} onChange={reiniciar(setDesde)} max={hasta} />
        <CampoFecha etiqueta="Hasta" value={hasta} onChange={reiniciar(setHasta)} min={desde} />
        <SelectFiltro etiqueta="Orden" value={orden} onChange={reiniciar(setOrden)}>
          <option value="desc">Más recientes primero</option>
          <option value="asc">Más antiguos primero</option>
        </SelectFiltro>
      </div>

      <Paginador pagina={pagina} porPagina={POR_PAGINA} total={datos.total} onCambiar={setPagina} className="mb-2" />

      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              {!producto && <th className="px-4 py-3">Producto</th>}
              {producto && !varianteId && producto.variantes.length > 0 && <th className="px-4 py-3">Talla / color</th>}
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Entra</th>
              <th className="px-4 py-3 text-right">Sale</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-right">Costo unit.</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {datos.movimientos.map((m) => (
              <tr key={m.id} className="border-t border-white/40 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-plum-soft">{fechaHora(m.fecha)}</td>
                {!producto && (
                  <td className="px-4 py-3">
                    <p className="font-medium text-plum">{m.producto_nombre || "—"}</p>
                    <p className="text-xs text-plum-soft">{[m.talla, m.color].filter(Boolean).join(" · ")}</p>
                  </td>
                )}
                {producto && !varianteId && producto.variantes.length > 0 && (
                  <td className="px-4 py-3 text-plum-soft">{[m.talla, m.color].filter(Boolean).join(" · ") || "—"}</td>
                )}
                <td className="px-4 py-3 text-plum">{m.tipo_label}</td>
                <td className="px-4 py-3 text-right font-medium text-plum">{m.cantidad > 0 ? `+${m.cantidad}` : ""}</td>
                <td className="px-4 py-3 text-right font-medium text-red-700">{m.cantidad < 0 ? m.cantidad : ""}</td>
                <td className="px-4 py-3 text-right text-plum">{m.stock_despues ?? "—"}</td>
                <td className="px-4 py-3 text-right text-plum-soft">{m.costo_unitario != null ? soles(m.costo_unitario) : "—"}</td>
                <td className="px-4 py-3 text-plum-soft">{m.usuario_nombre || "—"}</td>
                <td className="px-4 py-3 text-plum-soft">{referencia(m)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargando && <SkeletonFilasAdmin etiqueta="Cargando movimientos" />}
        {!cargando && datos.movimientos.length === 0 && (
          <p className="p-6 text-center text-plum-soft">No hay movimientos con esos filtros.</p>
        )}
      </div>

      {/* Tarjetas — solo móvil/tablet */}
      <div className="space-y-3 md:hidden">
        {datos.movimientos.map((m) => (
          <div key={m.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-plum">{m.producto_nombre || "—"}</p>
                <p className="text-xs text-plum-soft">{[m.talla, m.color].filter(Boolean).join(" · ")}</p>
              </div>
              <span className={`text-lg font-semibold ${m.cantidad < 0 ? "text-red-700" : "text-plum"}`}>
                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
              </span>
            </div>
            <p className="mt-1 text-sm text-plum">
              {m.tipo_label} · saldo {m.stock_despues ?? "—"}
            </p>
            <p className="text-xs text-plum-soft">{fechaHora(m.fecha)}{m.usuario_nombre ? ` · ${m.usuario_nombre}` : ""}</p>
            <p className="mt-1 text-xs text-plum-soft">{referencia(m)}</p>
          </div>
        ))}
        {cargando && <SkeletonFilasAdmin etiqueta="Cargando movimientos" />}
        {!cargando && datos.movimientos.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-plum-soft">No hay movimientos con esos filtros.</p>
        )}
      </div>
    </div>
  );
}
