import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../api/client.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useConfirm } from "../../../components/ConfirmDialog.jsx";
import { useToast } from "../../../context/ToastContext.jsx";
import { PUEDE_AJUSTAR_STOCK } from "../../../roles.js";
import Paginador from "../../../components/Paginador.jsx";
import Spinner from "../../../components/Spinner.jsx";
import { SkeletonFilasAdmin } from "../../../components/admin/EsqueletosAdmin.jsx";
import BarraFiltros from "../../../components/admin/BarraFiltros.jsx";
import { textoVariante } from "./TabStock.jsx";

const POR_PAGINA = 10;

const claveLinea = (productoId, varianteId) => `${productoId}-${varianteId || 0}`;

/**
 * Inventario físico: cuentas lo que hay en la bodega y el sistema ajusta las diferencias.
 * Lo contado se conserva aunque cambies de página o busques otro producto.
 */
export default function TabInventarioFisico() {
  const toast = useToast();
  const confirmar = useConfirm();
  const { usuario } = useAuth();
  const puedeAjustar = PUEDE_AJUSTAR_STOCK.includes(usuario?.rol);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ productos: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const pedido = useRef(0);

  // clave -> { producto_id, variante_id, nombre, esperado, contado (texto) }
  const [conteo, setConteo] = useState({});
  const [nota, setNota] = useState("");
  const [aplicando, setAplicando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    const numero = ++pedido.current;
    setCargando(true);
    const params = { pagina, por_pagina: POR_PAGINA };
    if (busquedaAplicada) params.q = busquedaAplicada;
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
  }, [pagina, busquedaAplicada, recarga]); // eslint-disable-line react-hooks/exhaustive-deps

  const contar = (linea, valor) => {
    const key = claveLinea(linea.producto_id, linea.variante_id);
    setConteo((c) => {
      if (valor === "") {
        const { [key]: _quitada, ...resto } = c;
        return resto;
      }
      // "esperado" es el stock que el sistema decía al empezar a contar esta línea; se conserva.
      const previo = c[key];
      return { ...c, [key]: { ...linea, esperado: previo ? previo.esperado : linea.esperado, contado: valor } };
    });
  };

  const lineas = useMemo(() => Object.values(conteo), [conteo]);
  const invalidas = lineas.filter((l) => !Number.isInteger(Number(l.contado)) || Number(l.contado) < 0);
  const conDiferencia = lineas.filter((l) => !invalidas.includes(l) && Number(l.contado) !== l.esperado);

  const aplicar = async () => {
    if (invalidas.length > 0) return toast.error("Hay cantidades contadas que no son válidas (deben ser enteros de 0 o más).");
    if (conDiferencia.length === 0) return toast.info("Todo lo que contaste coincide con el sistema. No hay nada que ajustar.");
    const ok = await confirmar({
      title: `¿Aplicar el conteo? Se ajustará el stock de ${conDiferencia.length} línea${conDiferencia.length === 1 ? "" : "s"}.`,
      message: "Cada ajuste queda en el kardex con tu nombre. Esto no se deshace con un clic.",
      confirmText: "Aplicar conteo",
    });
    if (!ok) return;
    setAplicando(true);
    try {
      const r = await api.adminInventarioFisico({
        nota: nota.trim() || null,
        lineas: lineas.map((l) => ({
          producto_id: l.producto_id,
          variante_id: l.variante_id,
          esperado: l.esperado,
          contado: Number(l.contado),
        })),
      });
      toast.success(`Conteo aplicado: ${r.ajustados} línea${r.ajustados === 1 ? "" : "s"} ajustada${r.ajustados === 1 ? "" : "s"}.`);
      setConteo({});
      setNota("");
      setRecarga((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "No se pudo aplicar el conteo");
    } finally {
      setAplicando(false);
    }
  };

  if (!puedeAjustar) {
    return <p className="glass rounded-2xl p-6 text-plum-soft">No tienes permiso para aplicar un inventario físico.</p>;
  }

  const filaLinea = (producto, variante) => {
    const linea = {
      producto_id: producto.producto_id,
      variante_id: variante ? variante.variante_id : null,
      nombre: variante ? `${producto.nombre} (${textoVariante(variante)})` : producto.nombre,
      esperado: variante ? variante.stock : producto.stock_total,
    };
    const key = claveLinea(linea.producto_id, linea.variante_id);
    const guardada = conteo[key];
    const valor = guardada ? guardada.contado : "";
    const esperado = guardada ? guardada.esperado : linea.esperado;
    const n = Number(valor);
    const diferencia = valor !== "" && Number.isInteger(n) && n >= 0 ? n - esperado : null;

    return (
      <div key={key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-plum/10">
        <span className="text-sm text-plum">{variante ? textoVariante(variante) || "Única" : "Unidades"}</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-plum-soft">
            Sistema: <span className="font-semibold text-plum">{esperado}</span>
          </span>
          <label className="flex items-center gap-2 text-plum-soft">
            Contado
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={valor}
              onChange={(e) => contar(linea, e.target.value)}
              aria-label={`Cantidad contada de ${linea.nombre}`}
              className="w-20 rounded-md bg-white px-2 py-1 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry"
            />
          </label>
          <span
            className={`w-14 text-right font-semibold ${diferencia === null || diferencia === 0 ? "text-plum-soft" : diferencia < 0 ? "text-red-700" : "text-berry-dark"}`}
            aria-live="polite"
          >
            {diferencia === null ? "" : diferencia > 0 ? `+${diferencia}` : diferencia}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24">
      <p className="mb-4 rounded-xl bg-white/60 p-4 text-sm text-plum-soft">
        Cuenta lo que hay en la bodega y escríbelo en <span className="font-semibold text-plum">Contado</span>. Lo que no cuentes
        no se toca. Al final aplicas el conteo y el sistema ajusta solo las diferencias. Si se vendió algo mientras contabas,
        esa venta se respeta.
      </p>

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por nombre o SKU"
        hayFiltros={Boolean(busqueda)}
        onLimpiar={() => {
          setBusqueda("");
          setBusquedaAplicada("");
          setPagina(1);
        }}
      />

      <Paginador pagina={pagina} porPagina={POR_PAGINA} total={datos.total} onCambiar={setPagina} className="mb-2" />

      <ul className="space-y-3">
        {datos.productos.map((p) => (
          <li key={p.producto_id} className="glass rounded-2xl p-4">
            <p className="font-medium text-plum">{p.nombre}</p>
            <p className="mb-2 text-xs text-plum-soft">{p.sku}</p>
            <div className="space-y-2">
              {p.variantes.length > 0 ? p.variantes.map((v) => filaLinea(p, v)) : filaLinea(p, null)}
            </div>
          </li>
        ))}
      </ul>
      {cargando && <SkeletonFilasAdmin etiqueta="Cargando stock" />}
      {!cargando && datos.productos.length === 0 && (
        <p className="glass rounded-2xl p-6 text-center text-plum-soft">No hay productos con esa búsqueda.</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-plum/10 bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-plum-soft" aria-live="polite">
            <span className="font-semibold text-plum">{lineas.length}</span> contadas ·{" "}
            <span className="font-semibold text-plum">{conDiferencia.length}</span> con diferencia
            {invalidas.length > 0 && <span className="text-red-700"> · {invalidas.length} no válidas</span>}
          </p>
          <div className="flex items-center gap-3">
            <input
              value={nota}
              maxLength={150}
              onChange={(e) => setNota(e.target.value)}
              aria-label="Nota del conteo (opcional)"
              placeholder="Nota (opcional)"
              className="w-40 rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry sm:w-56"
            />
            {lineas.length > 0 && (
              <button type="button" onClick={() => setConteo({})} className="text-sm text-plum-soft hover:text-berry">
                Borrar conteo
              </button>
            )}
            <button
              type="button"
              onClick={aplicar}
              disabled={aplicando || lineas.length === 0}
              className="inline-flex items-center rounded-[10px] bg-berry px-5 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-50"
            >
              {aplicando && <Spinner />}
              Aplicar conteo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
