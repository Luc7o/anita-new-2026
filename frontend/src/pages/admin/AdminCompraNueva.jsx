import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { rutaAdmin } from "../../lib/appMode.js";
import { useToast } from "../../context/ToastContext.jsx";
import { soles, hoyISO } from "../../formato.js";
import Spinner from "../../components/Spinner.jsx";
import { IconArrowLeft, IconSearch, IconTrash } from "../../components/Icons.jsx";
import { ETIQUETA_DOCUMENTO } from "./AdminCompras.jsx";

const campo =
  "w-full rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 hover:ring-plum/40 focus:outline-none focus:ring-2 focus:ring-berry";
const etiqueta = "mb-1 block text-xs font-medium text-plum-soft";

const textoVariante = (v) => [v.talla && `Talla ${v.talla}`, v.color].filter(Boolean).join(" · ");

export default function AdminCompraNueva() {
  const toast = useToast();
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState("");
  const [preciosProveedor, setPreciosProveedor] = useState({});
  const [tipoDocumento, setTipoDocumento] = useState("factura");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const pedido = useRef(0);

  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api
      .adminProveedores()
      .then((lista) => setProveedores(lista.filter((p) => p.activo)))
      .catch(() => toast.error("No se pudieron cargar los proveedores"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Al elegir proveedor, traemos el precio de compra que ya tienes acordado con él para sugerirlo como costo.
  useEffect(() => {
    if (!proveedorId) {
      setPreciosProveedor({});
      return;
    }
    let vigente = true;
    api
      .adminProveedor(proveedorId)
      .then((p) => {
        if (!vigente) return;
        const precios = {};
        for (const pp of p.productos || []) if (pp.activo && pp.precio_compra != null) precios[pp.producto_id] = pp.precio_compra;
        setPreciosProveedor(precios);
        // Completa los costos que aún estaban vacíos.
        setLineas((ls) =>
          ls.map((l) => (l.costo === "" && precios[l.producto_id] != null ? { ...l, costo: String(precios[l.producto_id]) } : l))
        );
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [proveedorId]);

  useEffect(() => {
    const texto = busqueda.trim();
    if (texto.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const numero = ++pedido.current;
    const t = setTimeout(() => {
      api
        .adminProductos({ q: texto, por_pagina: 8 })
        .then((r) => {
          if (numero === pedido.current) setResultados(r.productos || []);
        })
        .catch(() => {})
        .finally(() => {
          if (numero === pedido.current) setBuscando(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const agregar = (producto, variante) => {
    const key = `${producto.id}-${variante ? variante.id : 0}`;
    if (lineas.some((l) => l.key === key)) {
      toast.info("Ese producto ya está en la lista");
      return;
    }
    const sugerido = preciosProveedor[producto.id];
    setLineas((ls) => [
      ...ls,
      {
        key,
        producto_id: producto.id,
        variante_id: variante ? variante.id : null,
        nombre: producto.nombre,
        sku: producto.sku,
        detalle: variante ? textoVariante(variante) : "",
        stock: variante ? variante.stock : producto.stock,
        cantidad: "",
        costo: sugerido != null ? String(sugerido) : "",
      },
    ]);
  };

  const cambiar = (key, campoNombre, valor) =>
    setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, [campoNombre]: valor } : l)));
  const quitar = (key) => setLineas((ls) => ls.filter((l) => l.key !== key));

  const total = useMemo(
    () => lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.costo) || 0), 0),
    [lineas]
  );
  const unidades = useMemo(() => lineas.reduce((s, l) => s + (Number(l.cantidad) || 0), 0), [lineas]);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!proveedorId) return setError("Elige el proveedor de la compra.");
    if (lineas.length === 0) return setError("Agrega al menos un producto.");
    for (const l of lineas) {
      const nombre = `${l.nombre}${l.detalle ? ` (${l.detalle})` : ""}`;
      const cantidad = Number(l.cantidad);
      if (!Number.isInteger(cantidad) || cantidad < 1) return setError(`Escribe una cantidad entera mayor a 0 para ${nombre}.`);
      if (l.costo === "" || !Number.isFinite(Number(l.costo)) || Number(l.costo) < 0)
        return setError(`Escribe el costo unitario de ${nombre}.`);
    }

    setGuardando(true);
    try {
      const compra = await api.adminCrearCompra({
        proveedor_id: Number(proveedorId),
        tipo_documento: numeroDocumento.trim() ? tipoDocumento : null,
        numero_documento: numeroDocumento.trim() || null,
        fecha_compra: fecha,
        notas: notas.trim() || null,
        items: lineas.map((l) => ({
          producto_id: l.producto_id,
          variante_id: l.variante_id,
          cantidad: Number(l.cantidad),
          costo_unitario: Number(l.costo),
        })),
      });
      toast.success(`Compra ${compra.numero} registrada. El stock ya subió.`);
      navigate(rutaAdmin(`/compras/${compra.id}`));
    } catch (err) {
      setError(err.message || "No se pudo registrar la compra.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="pb-8">
      <Link to={rutaAdmin("/compras")} className="mb-3 inline-flex items-center gap-1 text-sm text-berry hover:underline">
        <IconArrowLeft size={14} /> Volver a compras
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-plum">Nueva compra</h1>
        <p className="text-sm text-plum-soft">Al guardarla, el stock de cada producto sube de inmediato.</p>
      </div>

      <section className="glass mb-5 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="compra-proveedor" className={etiqueta}>Proveedor</label>
            <select id="compra-proveedor" required value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} className={campo}>
              <option value="">Elige un proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="compra-fecha" className={etiqueta}>Fecha de la compra</label>
            <input id="compra-fecha" type="date" required value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} className={campo} />
          </div>
          <div>
            <label htmlFor="compra-tipo" className={etiqueta}>Documento del proveedor</label>
            <select id="compra-tipo" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className={campo}>
              {Object.entries(ETIQUETA_DOCUMENTO).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="compra-numdoc" className={etiqueta}>N.° de documento (opcional)</label>
            <input id="compra-numdoc" maxLength={40} value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)} placeholder="F001-00123" className={campo} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="compra-notas" className={etiqueta}>Notas (opcional)</label>
          <textarea id="compra-notas" rows={2} maxLength={1000} value={notas} onChange={(e) => setNotas(e.target.value)} className={campo} />
        </div>
      </section>

      <section className="glass mb-5 rounded-2xl p-5">
        <h2 className="mb-3 text-base font-semibold text-plum">Productos que llegaron</h2>
        <div className="relative">
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum-soft" />
          <input
            type="search"
            aria-label="Buscar producto por nombre o SKU"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre o SKU (mínimo 2 letras)"
            className={`${campo} pl-9`}
          />
        </div>

        {busqueda.trim().length >= 2 && (
          <div className="mt-2 space-y-2 rounded-xl bg-white/60 p-3" aria-live="polite">
            {buscando && <p className="text-sm text-plum-soft">Buscando…</p>}
            {!buscando && resultados.length === 0 && <p className="text-sm text-plum-soft">No se encontró ningún producto.</p>}
            {resultados.map((p) => (
              <div key={p.id} className="rounded-lg bg-white p-3 ring-1 ring-plum/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-plum">
                    {p.nombre} <span className="text-xs font-normal text-plum-soft">{p.sku}</span>
                  </p>
                  {!(p.variantes && p.variantes.length > 0) && (
                    <button type="button" onClick={() => agregar(p, null)} className="rounded-md bg-berry/10 px-3 py-1 text-xs font-semibold text-berry-dark hover:bg-berry/20">
                      Agregar (stock {p.stock})
                    </button>
                  )}
                </div>
                {p.variantes && p.variantes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.variantes.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => agregar(p, v)}
                        className="rounded-md bg-berry/10 px-2.5 py-1 text-xs font-semibold text-berry-dark hover:bg-berry/20"
                      >
                        {textoVariante(v)} · stock {v.stock}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {lineas.length === 0 ? (
          <p className="mt-4 rounded-xl bg-white/50 p-4 text-center text-sm text-plum-soft">
            Busca un producto y toca la talla y color que recibiste para agregarlo.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lineas.map((l) => (
              <li key={l.key} className="rounded-xl bg-white p-3 ring-1 ring-plum/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-plum">{l.nombre}</p>
                    <p className="text-xs text-plum-soft">
                      {[l.detalle, l.sku, `stock actual ${l.stock}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button type="button" onClick={() => quitar(l.key)} aria-label={`Quitar ${l.nombre} de la compra`} className="text-plum-soft hover:text-berry">
                    <IconTrash size={16} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`cant-${l.key}`} className={etiqueta}>Cantidad</label>
                    <input id={`cant-${l.key}`} type="number" inputMode="numeric" min="1" step="1" value={l.cantidad} onChange={(e) => cambiar(l.key, "cantidad", e.target.value)} className={campo} />
                  </div>
                  <div>
                    <label htmlFor={`costo-${l.key}`} className={etiqueta}>Costo unit. (S/)</label>
                    <input id={`costo-${l.key}`} type="number" inputMode="decimal" min="0" step="0.01" value={l.costo} onChange={(e) => cambiar(l.key, "costo", e.target.value)} className={campo} />
                  </div>
                  <div>
                    <span className={etiqueta}>Subtotal</span>
                    <p className="py-2 text-sm font-semibold text-plum">{soles((Number(l.cantidad) || 0) * (Number(l.costo) || 0))}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <div>
          <p className="text-sm text-plum-soft">{unidades} unidad{unidades === 1 ? "" : "es"} en {lineas.length} línea{lineas.length === 1 ? "" : "s"}</p>
          <p className="text-xl font-semibold text-plum">Total {soles(total)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={rutaAdmin("/compras")} className="text-sm text-plum-soft hover:text-berry">Cancelar</Link>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center rounded-[10px] bg-berry px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            {guardando && <Spinner />}
            {guardando ? "Registrando…" : "Registrar compra"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
