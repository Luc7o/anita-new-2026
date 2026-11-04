import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../api/client.js";
import { rutaAdmin } from "../../../lib/appMode.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { PUEDE_AJUSTAR_STOCK } from "../../../roles.js";
import Paginador from "../../../components/Paginador.jsx";
import { SkeletonFilasAdmin } from "../../../components/admin/EsqueletosAdmin.jsx";
import BarraFiltros from "../../../components/admin/BarraFiltros.jsx";
import ModalAjusteStock from "./ModalAjusteStock.jsx";

const POR_PAGINA = 15;

export const ESTADOS_STOCK = {
  agotado: { etiqueta: "Agotado", clase: "bg-red-100 text-red-700" },
  bajo: { etiqueta: "Stock bajo", clase: "bg-amber-100 text-amber-800" },
  ok: { etiqueta: "Disponible", clase: "bg-berry/10 text-berry-dark" },
};

export function InsigniaStock({ estado }) {
  const e = ESTADOS_STOCK[estado] || ESTADOS_STOCK.ok;
  return <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${e.clase}`}>{e.etiqueta}</span>;
}

export const textoVariante = (v) => [v.talla && `Talla ${v.talla}`, v.color].filter(Boolean).join(" · ");

// Stock mínimo editable: se guarda al salir del campo o al presionar Enter.
function MinimoEditable({ producto, puedeAjustar, onGuardado }) {
  const toast = useToast();
  const [valor, setValor] = useState(String(producto.stock_minimo));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => setValor(String(producto.stock_minimo)), [producto.stock_minimo]);

  if (!puedeAjustar) return <span className="font-medium text-plum">{producto.stock_minimo}</span>;

  const guardar = async () => {
    const n = Number(valor);
    if (valor === "" || !Number.isInteger(n) || n < 0) {
      toast.error("El stock mínimo debe ser un número entero de 0 o más");
      setValor(String(producto.stock_minimo));
      return;
    }
    if (n === producto.stock_minimo) return;
    setGuardando(true);
    try {
      const actualizado = await api.adminCambiarStockMinimo(producto.producto_id, n);
      toast.success("Stock mínimo actualizado");
      onGuardado(actualizado);
    } catch (err) {
      toast.error(err.message || "No se pudo guardar el stock mínimo");
      setValor(String(producto.stock_minimo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      step="1"
      aria-label={`Stock mínimo de ${producto.nombre}`}
      value={valor}
      disabled={guardando}
      onChange={(e) => setValor(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-20 rounded-md bg-white px-2 py-1 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry disabled:opacity-60"
    />
  );
}

export default function TabStock() {
  const toast = useToast();
  const { usuario } = useAuth();
  const puedeAjustar = PUEDE_AJUSTAR_STOCK.includes(usuario?.rol);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ productos: [], total: 0, resumen: { agotado: 0, bajo: 0, ok: 0 } });
  const [cargando, setCargando] = useState(true);
  const [ajuste, setAjuste] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const pedido = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const numero = ++pedido.current;
    setCargando(true);
    const params = { pagina, por_pagina: POR_PAGINA };
    if (busquedaAplicada) params.q = busquedaAplicada;
    if (estado) params.estado = estado;
    api
      .adminAlmacenStock(params)
      .then((r) => {
        if (numero === pedido.current) setDatos(r);
      })
      .catch((err) => {
        if (numero === pedido.current) toast.error(err.message || "No se pudo cargar el stock");
      })
      .finally(() => {
        if (numero === pedido.current) setCargando(false);
      });
  }, [pagina, busquedaAplicada, estado, recarga]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrarEstado = (e) => {
    setEstado((actual) => (actual === e ? "" : e));
    setPagina(1);
  };

  const reemplazar = (actualizado) =>
    setDatos((d) => ({ ...d, productos: d.productos.map((p) => (p.producto_id === actualizado.producto_id ? actualizado : p)) }));

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {["agotado", "bajo", "ok"].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => filtrarEstado(e)}
            aria-pressed={estado === e}
            className={`glass rounded-2xl p-4 text-left transition ${estado === e ? "ring-2 ring-berry" : "hover:ring-1 hover:ring-plum/30"}`}
          >
            <p className="text-2xl font-semibold text-plum">{datos.resumen[e]}</p>
            <p className="text-xs text-plum-soft">{e === "agotado" ? "Agotados" : e === "bajo" ? "Con stock bajo" : "Disponibles"}</p>
          </button>
        ))}
      </div>

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por nombre o SKU"
        hayFiltros={Boolean(busqueda || estado)}
        onLimpiar={() => {
          setBusqueda("");
          setBusquedaAplicada("");
          setEstado("");
          setPagina(1);
        }}
      />

      <Paginador pagina={pagina} porPagina={POR_PAGINA} total={datos.total} onCambiar={setPagina} className="mb-2" />

      <ul className="space-y-3">
        {datos.productos.map((p) => (
          <li key={p.producto_id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-plum">{p.nombre}</p>
                <p className="text-xs text-plum-soft">{[p.sku, p.categoria].filter(Boolean).join(" · ")}</p>
              </div>
              <InsigniaStock estado={p.estado} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-plum-soft">
              <span>
                Stock: <span className="text-base font-semibold text-plum">{p.stock_total}</span>
              </span>
              <span className="flex items-center gap-2">
                Mínimo: <MinimoEditable producto={p} puedeAjustar={puedeAjustar} onGuardado={reemplazar} />
              </span>
              <Link
                to={`${rutaAdmin("/almacen")}?vista=movimientos&producto_id=${p.producto_id}`}
                className="text-berry hover:underline"
              >
                Ver kardex
              </Link>
              {puedeAjustar && p.variantes.length === 0 && (
                <button type="button" onClick={() => setAjuste({ producto: p, variante: null })} className="text-berry hover:underline">
                  Merma / ajuste
                </button>
              )}
            </div>

            {p.variantes.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.variantes.map((v) => (
                  <li key={v.variante_id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs ring-1 ring-plum/10">
                    <span className="text-plum-soft">{textoVariante(v) || "Única"}</span>
                    <span className={`font-semibold ${v.stock <= 0 ? "text-red-700" : "text-plum"}`}>{v.stock}</span>
                    {puedeAjustar && (
                      <button
                        type="button"
                        onClick={() => setAjuste({ producto: p, variante: v })}
                        aria-label={`Merma o ajuste de ${p.nombre} ${textoVariante(v)}`}
                        className="text-berry hover:underline"
                      >
                        Ajustar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {cargando && <SkeletonFilasAdmin etiqueta="Cargando stock" />}
      {!cargando && datos.productos.length === 0 && (
        <p className="glass rounded-2xl p-6 text-center text-plum-soft">
          {busqueda || estado ? "No hay productos con esos filtros." : "Todavía no hay productos."}
        </p>
      )}

      {ajuste && (
        <ModalAjusteStock
          producto={ajuste.producto}
          variante={ajuste.variante}
          onCerrar={() => setAjuste(null)}
          onHecho={() => {
            setAjuste(null);
            setRecarga((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
