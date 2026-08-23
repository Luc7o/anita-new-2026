import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { IconSearch, IconClose } from "../../components/Icons.jsx";

const METODOS_PAGO = [
  { valor: "efectivo", label: "Efectivo" },
  { valor: "yape", label: "Yape" },
  { valor: "tarjeta", label: "Tarjeta física" },
];

export default function AdminVentaPresencial() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Producto seleccionado en el buscador, pendiente de elegir talla/color/cantidad
  const [seleccion, setSeleccion] = useState(null);
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Carrito local de la venta
  const [items, setItems] = useState([]);

  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");

  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [descargandoBoleta, setDescargandoBoleta] = useState(false);

  const buscarProductos = async (e) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setBuscando(true);
    try {
      const data = await api.adminProductos({ q: busqueda.trim() });
      setResultados(data.productos);
    } finally {
      setBuscando(false);
    }
  };

  const elegirProducto = (producto) => {
    setSeleccion(producto);
    setTalla(producto.tallas?.[0] || "");
    setColor(producto.colores?.[0] || "");
    setCantidad(1);
  };

  const agregarAlCarrito = () => {
    if (!seleccion) return;
    setItems([
      ...items,
      {
        producto_id: seleccion.id,
        nombre: seleccion.nombre,
        talla: seleccion.tallas?.length ? talla : null,
        color: seleccion.colores?.length ? color : null,
        cantidad: Number(cantidad) || 1,
        precio_unit: seleccion.precio_final,
      },
    ]);
    setSeleccion(null);
    setResultados([]);
    setBusqueda("");
  };

  const quitarDelCarrito = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, it) => acc + it.precio_unit * it.cantidad, 0);

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
      });
      setPedidoConfirmado(pedido);
      setItems([]);
      setClienteNombre("");
      setClienteTelefono("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistrando(false);
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
        <div className="glass rounded-3xl p-8 text-center shadow-glass">
          <h1 className="font-display text-xl font-semibold text-plum">Venta registrada</h1>
          <p className="mt-1 text-sm text-plum-soft">
            Pedido {pedidoConfirmado.numero_pedido} · S/ {pedidoConfirmado.total.toFixed(2)}
          </p>

          <button
            onClick={descargarBoleta}
            disabled={descargandoBoleta}
            className="mt-6 w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
          >
            {descargandoBoleta ? "Generando boleta..." : "Descargar boleta"}
          </button>
          <button
            onClick={() => setPedidoConfirmado(null)}
            className="mt-3 w-full rounded-full bg-white/70 py-3 text-center font-semibold text-plum shadow-glass hover:bg-white"
          >
            Registrar otra venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/pedidos" className="text-sm text-berry hover:underline">
        ← Volver a pedidos
      </Link>

      <div className="glass mt-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-plum">Venta presencial</h1>
        <p className="text-sm text-plum-soft">
          Registra una venta hecha en el mostrador — el pago se marca como recibido al momento.
        </p>

        {/* Buscador de productos */}
        <form onSubmit={buscarProductos} className="mt-6 flex gap-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto por nombre..."
            className="flex-1 rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-plum shadow-glass focus:outline-none"
          />
          <button
            type="submit"
            disabled={buscando}
            className="flex items-center gap-1 rounded-2xl bg-berry px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-berry-dark disabled:opacity-60"
          >
            <IconSearch size={16} /> Buscar
          </button>
        </form>

        {resultados.length > 0 && !seleccion && (
          <div className="mt-3 max-h-60 space-y-1 overflow-y-auto rounded-2xl bg-white/50 p-2">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => elegirProducto(p)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-white/80"
              >
                <span>{p.nombre}</span>
                <span className="text-plum-soft">S/ {p.precio_final.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Producto elegido: talla/color/cantidad */}
        {seleccion && (
          <div className="mt-4 rounded-2xl bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-plum">{seleccion.nombre}</p>
              <button onClick={() => setSeleccion(null)} className="text-plum-soft hover:text-plum">
                <IconClose size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              {seleccion.tallas?.length > 0 && (
                <label className="text-xs text-plum-soft">
                  Talla
                  <select
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                    className="mt-1 block rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
                  >
                    {seleccion.tallas.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
              )}
              {seleccion.colores?.length > 0 && (
                <label className="text-xs text-plum-soft">
                  Color
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="mt-1 block rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
                  >
                    {seleccion.colores.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="text-xs text-plum-soft">
                Cantidad
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="mt-1 block w-20 rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
                />
              </label>
              <button
                onClick={agregarAlCarrito}
                className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-glass hover:bg-berry-dark"
              >
                Agregar
              </button>
            </div>
            {/* Nota: la disponibilidad exacta de stock se valida al registrar la
                venta — si falta stock, el mensaje de error lo indica ahí. */}
          </div>
        )}

        {/* Carrito de la venta */}
        {items.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-white/50 pt-4">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm text-plum-soft">
                <span>
                  {it.cantidad}× {it.nombre}
                  {it.talla && ` · ${it.talla}`}
                  {it.color && ` · ${it.color}`}
                </span>
                <div className="flex items-center gap-2">
                  <span>S/ {(it.precio_unit * it.cantidad).toFixed(2)}</span>
                  <button onClick={() => quitarDelCarrito(i)} className="text-plum-soft hover:text-berry-dark">
                    <IconClose size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/50 pt-2 font-display text-base font-semibold text-plum">
              <span>Total</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Datos de pago y cliente */}
        <div className="mt-6 grid gap-3 border-t border-white/50 pt-4 sm:grid-cols-2">
          <label className="text-xs text-plum-soft">
            Método de pago recibido
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
            >
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>{m.label}</option>
              ))}
            </select>
          </label>
          <div />
          <label className="text-xs text-plum-soft">
            Nombre del cliente (opcional)
            <input
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
            />
          </label>
          <label className="text-xs text-plum-soft">
            Teléfono del cliente (opcional)
            <input
              value={clienteTelefono}
              onChange={(e) => setClienteTelefono(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-white px-3 py-2 text-sm text-plum shadow-glass focus:outline-none"
            />
          </label>
        </div>

        <button
          onClick={registrarVenta}
          disabled={registrando || items.length === 0}
          className="mt-6 w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
        >
          {registrando ? "Registrando..." : `Registrar venta${items.length ? ` — S/ ${total.toFixed(2)}` : ""}`}
        </button>
        {error && <p className="mt-2 text-center text-sm text-berry-dark">{error}</p>}
      </div>
    </div>
  );
}
