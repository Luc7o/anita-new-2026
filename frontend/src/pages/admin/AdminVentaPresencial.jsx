import { rutaAdmin } from "../../lib/appMode.js";
import Spinner from "../../components/Spinner.jsx";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { soles } from "../../formato.js";
import { IconSearch, IconClose, IconTrash } from "../../components/Icons.jsx";
import { soloDni } from "../../validacion.js";

const METODOS_PAGO = [
  { valor: "efectivo", label: "Efectivo" },
  { valor: "yape", label: "Yape" },
  { valor: "tarjeta", label: "Tarjeta física" },
];

const claveItem = (id, talla, color) => `${id}|${talla || ""}|${color || ""}`;

// Stock disponible de un producto para una talla/color (misma regla que el backend)
function stockDe(producto, talla, color) {
  if (!producto.usa_variantes) return producto.stock ?? 0;
  const t = producto.tallas?.length ? talla || "" : "";
  const c = producto.colores?.length ? color || "" : "";
  const v = (producto.variantes || []).find((x) => (x.talla || "") === t && (x.color || "") === c);
  return v ? v.stock : 0;
}

export default function AdminVentaPresencial() {
  const inputRef = useRef(null);
  const ultimaBusqueda = useRef(0);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const [aviso, setAviso] = useState("");

  // Producto seleccionado, pendiente de elegir talla/color/cantidad
  const [seleccion, setSeleccion] = useState(null);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Carrito local de la venta
  const [items, setItems] = useState([]);

  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteDni, setClienteDni] = useState("");
  const [consultandoDni, setConsultandoDni] = useState(false);
  const [avisoDni, setAvisoDni] = useState("");

  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [descargandoBoleta, setDescargandoBoleta] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, [pedidoConfirmado]);

  const total = items.reduce((acc, it) => acc + it.precio_unit * it.cantidad, 0);
  const unidades = items.reduce((acc, it) => acc + it.cantidad, 0);
  const vuelto = metodoPago === "efectivo" && montoRecibido !== "" ? Number(montoRecibido) - total : null;

  // Unidades de un producto/variante que ya están en el carrito
  const enCarrito = (producto, t, c) =>
    items.find((it) => it.clave === claveItem(producto.id, producto.tallas?.length ? t : "", producto.colores?.length ? c : ""))?.cantidad || 0;

  // Búsqueda en vivo por nombre o SKU (con espera corta para no saturar al escribir)
  useEffect(() => {
    const q = busqueda.trim();
    if (!q) {
      setResultados([]);
      setSinResultados(false);
      return;
    }
    const t = setTimeout(() => buscar(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const buscar = async (q) => {
    const id = ++ultimaBusqueda.current;
    setBuscando(true);
    try {
      const data = await api.adminProductos({ q, activo: "true", por_pagina: 12 });
      if (id !== ultimaBusqueda.current) return; // llegó una respuesta más nueva
      setResultados(data.productos);
      setSinResultados(data.productos.length === 0);
      return data.productos;
    } catch {
      if (id === ultimaBusqueda.current) setResultados([]);
    } finally {
      if (id === ultimaBusqueda.current) setBuscando(false);
    }
  };

  const limpiarBusqueda = () => {
    ultimaBusqueda.current++;
    setBusqueda("");
    setResultados([]);
    setSinResultados(false);
    setSeleccion(null);
    inputRef.current?.focus();
  };

  const elegirProducto = (producto) => {
    setAviso("");
    const t = producto.tallas?.find((x) => stockDe(producto, x, producto.colores?.[0] || "") > 0) || producto.tallas?.[0] || "";
    const c = producto.colores?.[0] || "";
    setSeleccion(producto);
    setTalla(t);
    setColor(c);
    setCantidad(1);
  };

  const agregar = (producto, t, c, cant) => {
    const tallaFinal = producto.tallas?.length ? t : null;
    const colorFinal = producto.colores?.length ? c : null;
    const clave = claveItem(producto.id, tallaFinal, colorFinal);
    const disponible = stockDe(producto, tallaFinal, colorFinal);
    const ya = items.find((it) => it.clave === clave)?.cantidad || 0;
    if (ya + cant > disponible) {
      setAviso(`Solo hay ${disponible} unidad(es) de «${producto.nombre}»${ya ? ` (ya tienes ${ya} en la venta)` : ""}.`);
      return false;
    }
    setAviso("");
    setItems((prev) => {
      const existe = prev.find((it) => it.clave === clave);
      if (existe) {
        return prev.map((it) => (it.clave === clave ? { ...it, cantidad: it.cantidad + cant } : it));
      }
      return [
        ...prev,
        {
          clave,
          producto_id: producto.id,
          nombre: producto.nombre,
          sku: producto.sku,
          imagen: producto.imagen_url,
          talla: tallaFinal,
          color: colorFinal,
          cantidad: cant,
          precio_unit: producto.precio_final,
          stock_max: disponible,
        },
      ];
    });
    return true;
  };

  const confirmarSeleccion = () => {
    if (!seleccion) return;
    if (agregar(seleccion, talla, color, Math.max(1, Number(cantidad) || 1))) {
      setSeleccion(null);
      setResultados([]);
      setBusqueda("");
      inputRef.current?.focus();
    }
  };

  // Enter en el buscador: pensado para escribir el SKU (o escanearlo) y seguir.
  // - SKU exacto de un producto sin tallas/colores → se agrega directo.
  // - SKU exacto con variantes → se abre para elegir talla/color.
  // - Un solo resultado → se abre para confirmarlo.
  const alEnviarBusqueda = async (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q) return;
    const lista = (await buscar(q)) || [];
    const exacto = lista.find((p) => (p.sku || "").toLowerCase() === q.toLowerCase());
    const candidato = exacto || (lista.length === 1 ? lista[0] : null);
    if (!candidato) return;
    if (candidato.sin_stock) {
      setAviso(`«${candidato.nombre}» no tiene stock.`);
      return;
    }
    if (!candidato.usa_variantes && exacto) {
      if (agregar(candidato, "", "", 1)) limpiarBusqueda();
    } else {
      elegirProducto(candidato);
    }
  };

  const cambiarCantidad = (clave, delta) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.clave !== clave) return it;
        const nueva = it.cantidad + delta;
        if (nueva < 1) return it;
        if (nueva > it.stock_max) {
          setAviso(`Solo hay ${it.stock_max} unidad(es) de «${it.nombre}».`);
          return it;
        }
        setAviso("");
        return { ...it, cantidad: nueva };
      })
    );
  };

  const quitarDelCarrito = (clave) => setItems((prev) => prev.filter((it) => it.clave !== clave));

  const registrarVenta = async () => {
    if (items.length === 0) return;
    setRegistrando(true);
    setError("");
    try {
      const pedido = await api.adminVentaPresencial({
        productos: items.map((it) => ({
          producto_id: it.producto_id,
          talla: it.talla,
          color: it.color,
          cantidad: it.cantidad,
        })),
        metodo_pago: metodoPago,
        cliente_nombre: clienteNombre || undefined,
        cliente_telefono: clienteTelefono || undefined,
        cliente_dni: clienteDni || undefined,
      });
      setPedidoConfirmado(pedido);
      setItems([]);
      setMontoRecibido("");
      setClienteNombre("");
      setClienteTelefono("");
      setClienteDni("");
      setAvisoDni("");
      setAviso("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistrando(false);
    }
  };

  // Autocompleta el nombre con RENIEC (solo cuando el cajero lo pide, así no
  // se gastan consultas de la API en cada tecleo).
  const consultarDni = async () => {
    if (clienteDni.length !== 8) return;
    setConsultandoDni(true);
    setAvisoDni("");
    try {
      const d = await api.consultarDocumento("dni", clienteDni);
      const nombre = [d.nombres, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(" ");
      if (nombre) setClienteNombre(nombre);
      setAvisoDni(nombre ? "DNI verificado." : "");
    } catch (err) {
      setAvisoDni(err.status === 404 ? "No se encontró ese DNI." : "No se pudo consultar ahora; puedes escribir el nombre a mano.");
    } finally {
      setConsultandoDni(false);
    }
  };

  const descargarBoleta = async () => {
    setDescargandoBoleta(true);
    try {
      await api.adminBoletaPedido(pedidoConfirmado.id, pedidoConfirmado.numero_pedido);
    } finally {
      setDescargandoBoleta(false);
    }
  };

  // Pantalla de confirmación después de registrar la venta
  if (pedidoConfirmado) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="glass rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold text-plum">Venta registrada</h1>
          <p className="mt-1 text-sm text-plum-soft">
            Pedido {pedidoConfirmado.numero_pedido} · S/ {pedidoConfirmado.total.toFixed(2)}
          </p>

          <button
            onClick={descargarBoleta}
            disabled={descargandoBoleta}
            className="mt-6 w-full rounded-[10px] bg-berry py-3 text-center font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            {descargandoBoleta ? <><Spinner />Generando boleta...</> : "Descargar boleta"}
          </button>
          <button
            onClick={() => setPedidoConfirmado(null)}
            className="mt-3 w-full rounded-[10px] bg-white py-3 text-center font-semibold text-plum hover:bg-white"
          >
            Registrar otra venta
          </button>
        </div>
      </div>
    );
  }

  const stockSel = seleccion ? stockDe(seleccion, talla, color) : 0;
  const yaSel = seleccion ? enCarrito(seleccion, talla, color) : 0;
  const maxSel = Math.max(stockSel - yaSel, 0);

  const campo = "mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/15 focus:outline-none focus:ring-2 focus:ring-berry/40";

  return (
    <div>
      <Link to={rutaAdmin("/pedidos")} className="text-sm text-berry hover:underline">
        ← Volver a pedidos
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Columna izquierda: buscar y elegir productos */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-plum">Venta presencial</h1>
          <p className="text-sm text-plum-soft">
            Registra una venta hecha en el mostrador — el pago se marca como recibido al momento.
          </p>

          <form onSubmit={alEnviarBusqueda} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código SKU (ej. ROP-000123)…"
                autoComplete="off"
                className="w-full rounded-2xl bg-white px-4 py-2.5 pr-9 text-sm text-plum ring-1 ring-plum/15 focus:outline-none focus:ring-2 focus:ring-berry/40"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={limpiarBusqueda}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-plum-soft hover:text-plum"
                >
                  <IconClose size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="flex items-center gap-1 rounded-2xl bg-berry px-4 py-2.5 text-sm font-semibold text-white hover:bg-berry-dark disabled:opacity-60"
            >
              {buscando ? <Spinner /> : <IconSearch size={16} />} Buscar
            </button>
          </form>
          <p className="mt-2 text-xs text-plum-soft">
            Tip: escribe o escanea el SKU y pulsa Enter — si el producto no tiene tallas ni colores se agrega solo.
          </p>

          {aviso && (
            <p role="alert" className="mt-3 rounded-xl bg-berry/10 px-3 py-2 text-sm text-berry-dark">{aviso}</p>
          )}

          {sinResultados && !buscando && !seleccion && (
            <p className="mt-3 text-sm text-plum-soft">No se encontró ningún producto activo con «{busqueda.trim()}».</p>
          )}

          {resultados.length > 0 && !seleccion && (
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto rounded-2xl bg-white p-2">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegirProducto(p)}
                  disabled={p.sin_stock}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-berry/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-plum/10" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.nombre}</span>
                    <span className="block text-xs text-plum-soft">
                      <span className="font-mono">{p.sku || "sin SKU"}</span>
                      {" · "}
                      {p.sin_stock ? "Sin stock" : `Stock: ${p.stock}`}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{soles(p.precio_final)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Producto elegido: talla/color/cantidad */}
          {seleccion && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {seleccion.imagen_url && (
                    <img src={seleccion.imagen_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-plum">{seleccion.nombre}</p>
                    <p className="text-xs text-plum-soft">
                      <span className="font-mono">{seleccion.sku || "sin SKU"}</span> · {soles(seleccion.precio_final)}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setSeleccion(null)} aria-label="Cerrar" className="text-plum-soft hover:text-plum">
                  <IconClose size={16} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                {seleccion.tallas?.length > 0 && (
                  <label className="text-xs text-plum-soft">
                    Talla
                    <select
                      value={talla}
                      onChange={(e) => { setTalla(e.target.value); setCantidad(1); }}
                      className="mt-1 block rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/10 focus:outline-none"
                    >
                      {seleccion.tallas.map((t) => {
                        const st = stockDe(seleccion, t, color);
                        return <option key={t} value={t} disabled={st <= 0}>{t}{st <= 0 ? " (agotada)" : ""}</option>;
                      })}
                    </select>
                  </label>
                )}
                {seleccion.colores?.length > 0 && (
                  <label className="text-xs text-plum-soft">
                    Color
                    <select
                      value={color}
                      onChange={(e) => { setColor(e.target.value); setCantidad(1); }}
                      className="mt-1 block rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/10 focus:outline-none"
                    >
                      {seleccion.colores.map((c) => {
                        const st = stockDe(seleccion, talla, c);
                        return <option key={c} value={c} disabled={st <= 0}>{c}{st <= 0 ? " (agotado)" : ""}</option>;
                      })}
                    </select>
                  </label>
                )}
                <label className="text-xs text-plum-soft">
                  Cantidad
                  <input
                    type="number"
                    min={1}
                    max={maxSel || 1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmarSeleccion(); } }}
                    className="mt-1 block w-20 rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/10 focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={confirmarSeleccion}
                  disabled={maxSel <= 0}
                  className="rounded-[10px] bg-berry px-4 py-2 text-sm font-semibold text-white hover:bg-berry-dark disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              <p className={`mt-2 text-xs ${stockSel <= 0 ? "text-berry-dark" : "text-plum-soft"}`}>
                {stockSel <= 0
                  ? "Esta combinación no tiene stock."
                  : `Disponible: ${stockSel}${yaSel ? ` (${yaSel} ya en la venta)` : ""}`}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha: resumen de la venta */}
        <div className="glass h-fit rounded-2xl p-6 sm:p-8 lg:sticky lg:top-4">
          <h2 className="text-lg font-semibold text-plum">
            Venta actual{unidades > 0 && <span className="ml-2 text-sm font-normal text-plum-soft">({unidades} {unidades === 1 ? "unidad" : "unidades"})</span>}
          </h2>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-plum-soft">Aún no agregaste productos.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {items.map((it) => (
                <div key={it.clave} className="flex items-center gap-3 text-sm">
                  {it.imagen && <img src={it.imagen} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-plum">{it.nombre}</p>
                    <p className="text-xs text-plum-soft">
                      <span className="font-mono">{it.sku}</span>
                      {it.talla && ` · ${it.talla}`}
                      {it.color && ` · ${it.color}`}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button type="button" onClick={() => cambiarCantidad(it.clave, -1)} disabled={it.cantidad <= 1} aria-label="Restar una unidad" className="h-6 w-6 rounded-full bg-white text-plum hover:bg-berry/10 disabled:opacity-40">−</button>
                      <span className="w-5 text-center text-plum">{it.cantidad}</span>
                      <button type="button" onClick={() => cambiarCantidad(it.clave, 1)} disabled={it.cantidad >= it.stock_max} aria-label="Sumar una unidad" className="h-6 w-6 rounded-full bg-white text-plum hover:bg-berry/10 disabled:opacity-40">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-plum">{soles(it.precio_unit * it.cantidad)}</span>
                    <button type="button" onClick={() => quitarDelCarrito(it.clave)} aria-label={`Quitar ${it.nombre}`} className="text-plum-soft hover:text-berry-dark">
                      <IconTrash size={15} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/50 pt-3 text-base font-semibold text-plum">
                <span>Total</span>
                <span>{soles(total)}</span>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-white/50 pt-4">
            <p className="text-xs text-plum-soft">Método de pago recibido</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setMetodoPago(m.valor)}
                  aria-pressed={metodoPago === m.valor}
                  className={`rounded-xl px-2 py-2 text-sm font-medium transition ${
                    metodoPago === m.valor ? "bg-berry text-white" : "bg-white text-plum hover:bg-berry/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {metodoPago === "efectivo" && items.length > 0 && (
              <div className="mt-3">
                <label className="text-xs text-plum-soft">
                  Monto recibido (opcional, para calcular el vuelto)
                  <input
                    type="number"
                    min={0}
                    step="0.10"
                    inputMode="decimal"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className={campo}
                  />
                </label>
                {vuelto !== null && (
                  <p className={`mt-1 text-sm font-semibold ${vuelto < 0 ? "text-berry-dark" : "text-plum"}`}>
                    {vuelto < 0 ? `Faltan ${soles(-vuelto)}` : `Vuelto: ${soles(vuelto)}`}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3">
              <label className="text-xs text-plum-soft" htmlFor="venta-dni">DNI del cliente (opcional)</label>
              <div className="mt-1 flex gap-2">
                <input
                  id="venta-dni"
                  value={clienteDni}
                  onChange={(e) => { setClienteDni(soloDni(e.target.value)); setAvisoDni(""); }}
                  inputMode="numeric"
                  maxLength={8}
                  pattern="[0-9]{8}"
                  placeholder="8 dígitos"
                  className="block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/15 focus:outline-none focus:ring-2 focus:ring-berry/40"
                />
                <button
                  type="button"
                  onClick={consultarDni}
                  disabled={clienteDni.length !== 8 || consultandoDni}
                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-medium text-berry ring-1 ring-berry/30 hover:bg-berry/5 disabled:opacity-50"
                >
                  {consultandoDni ? <Spinner /> : "Autocompletar"}
                </button>
              </div>
              {clienteDni && clienteDni.length < 8 && (
                <p className="mt-1 text-xs text-berry-dark">El DNI debe tener 8 dígitos.</p>
              )}
              {avisoDni && <p className="mt-1 text-xs text-plum-soft">{avisoDni}</p>}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-xs text-plum-soft">
                Nombre del cliente (opcional)
                <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className={campo} />
              </label>
              <label className="text-xs text-plum-soft">
                Teléfono del cliente (opcional)
                <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} inputMode="tel" className={campo} />
              </label>
            </div>
          </div>

          <button
            onClick={registrarVenta}
            disabled={registrando || items.length === 0 || (vuelto !== null && vuelto < 0) || (clienteDni !== "" && clienteDni.length !== 8)}
            className="mt-6 w-full rounded-[10px] bg-berry py-3 text-center font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            {registrando ? <><Spinner />Registrando...</> : `Registrar venta${items.length ? ` — ${soles(total)}` : ""}`}
          </button>
          {error && <p className="mt-2 text-center text-sm text-berry-dark">{error}</p>}
        </div>
      </div>
    </div>
  );
}
