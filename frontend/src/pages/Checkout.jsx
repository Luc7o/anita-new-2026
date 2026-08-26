import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { soloTexto, soloNumeros } from "../validacion.js";
import { abrirCulqiCheckout } from "../culqi.js";
import { obtenerPagoIdempotencyKey, limpiarPagoIdempotencyKey } from "../pagoIdempotencia.js";

const METODOS = [
  { id: "yape", label: "Yape" },
  { id: "tarjeta", label: "Tarjeta" },
];

export default function Checkout() {
  const { items, total, vaciarLocal, eliminar } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    envio_nombre: usuario?.nombre_completo || "",
    envio_telefono: "",
    envio_direccion: "",
    envio_distrito: "",
    envio_provincia: "",
    envio_dpto: "",
    envio_referencia: "",
    tipo_entrega: "delivery",
    metodo_pago: "yape",
    nota: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // Cuando el backend rechaza el checkout por falta de stock, guarda acá el
  // detalle item por item (item_id, mensaje, etc.) para poder mostrarlo
  // junto al producto exacto en el resumen, en vez de un error genérico.
  const [itemsSinStock, setItemsSinStock] = useState([]);
  const [quitandoItemId, setQuitandoItemId] = useState(null);
  // Solo se usa en mobile: si el panel de detalle del resumen (bajo la
  // barra fija de abajo) está expandido o no.
  const [resumenAbierto, setResumenAbierto] = useState(false);

  // Clave de idempotencia: se genera UNA vez por intento de compra y se
  // reutiliza en reintentos (doble clic, reintento de red tras timeout,
  // o si el usuario recarga la página sin haber terminado el checkout).
  // Así, si el backend ya recibió esta clave, devuelve el mismo pedido en
  // vez de crear uno duplicado con doble descuento de stock. Se limpia
  // recién cuando el pedido se confirma con éxito.
  const [idempotencyKey] = useState(() => {
    try {
      const existente = sessionStorage.getItem("ans_checkout_idempotency_key");
      if (existente) return existente;
      const nueva = crypto.randomUUID();
      sessionStorage.setItem("ans_checkout_idempotency_key", nueva);
      return nueva;
    } catch {
      // sessionStorage no disponible (modo privado, etc.): igual generamos
      // la clave, solo que no sobrevive a un reload.
      return crypto.randomUUID();
    }
  });

  const actualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefonoEnvio = (e) => setForm({ ...form, envio_telefono: soloNumeros(e.target.value) });

  const costoEnvio = form.tipo_entrega === "delivery" ? 10 : 0;

  const quitarItemSinStock = async (itemId) => {
    setQuitandoItemId(itemId);
    try {
      await eliminar(itemId);
      setItemsSinStock((prev) => prev.filter((p) => p.item_id !== itemId));
    } catch (err) {
      setError(err.message);
    } finally {
      setQuitandoItemId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setItemsSinStock([]);
    setEnviando(true);

    try {
      // 1) Se crea el pedido (reserva el stock, calcula el total) con
      //    estado_pago "pendiente".
      const pedido = await api.checkout({ ...form, idempotency_key: idempotencyKey });
      try {
        sessionStorage.removeItem("ans_checkout_idempotency_key");
      } catch {
        // no-op: si sessionStorage no está disponible tampoco se llegó a usar
      }
      vaciarLocal();

      // 2) Si el pedido necesita pago por pasarela, abrimos el widget de
      //    Culqi ahí mismo (sin salir de la página) y, apenas nos da un
      //    token, se lo mandamos al backend para cobrar de verdad.
      if (pedido.estado_pago === "pendiente") {
        try {
          const { tokenId, email } = await abrirCulqiCheckout({
            amountCentavos: Math.round(pedido.total * 100),
            email: usuario?.email,
            metodoPago: pedido.metodo_pago,
          });
          const idempotencyKeyPago = obtenerPagoIdempotencyKey(pedido.id);
          await api.pagarPedido(pedido.id, {
            token_id: tokenId,
            email,
            idempotency_key: idempotencyKeyPago,
          });
          limpiarPagoIdempotencyKey(pedido.id);
        } catch {
          // El cliente cerró el widget, Culqi rechazó el pago, o el cobro
          // automático no está disponible todavía. El pedido ya quedó
          // creado — lo mandamos al detalle, donde puede reintentar el pago
          // (sin limpiar la clave: si el cobro sí llegó a hacerse en Culqi
          // pero la respuesta no llegó al navegador, el backend la
          // reconoce y no vuelve a cobrar).
        }
      }

      navigate(`/pedidos/${pedido.id}`);
    } catch (err) {
      // 409 con items_sin_stock: no fue un error genérico de servidor, sino
      // que uno o más productos del carrito se quedaron sin stock justo
      // ahora. Lo mostramos junto a cada producto afectado en el resumen.
      if (err.status === 409 && err.data?.items_sin_stock?.length) {
        setItemsSinStock(err.data.items_sin_stock);
        setError("");
      } else {
        setError(err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="mx-auto max-w-2xl px-4 py-16 text-center text-plum-soft">
        Tu carrito está vacío. Agrega productos antes de continuar con el pago.
      </p>
    );
  }

  // Contenido del resumen (ítems + desglose) — se reutiliza tal cual en la
  // columna lateral sticky de desktop y en el panel expandible de mobile,
  // para no mantener el mismo JSX duplicado en dos lugares.
  const resumenContenido = (
    <>
      <h2 className="font-display text-lg font-semibold text-plum">Resumen</h2>
      {items.map((item) => {
        const problema = itemsSinStock.find((p) => p.item_id === item.id);
        return (
          <div key={item.id}>
            <div className="flex justify-between text-sm text-plum-soft">
              <span>
                {item.cantidad}× {item.producto.nombre}
              </span>
              <span>S/ {item.subtotal.toFixed(2)}</span>
            </div>
            {problema && (
              <div
                role="alert"
                className="mt-1 rounded-xl border border-berry/30 bg-berry/5 p-2.5 text-xs text-berry-dark"
              >
                <p className="mb-1.5">{problema.mensaje}</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/producto/${item.producto.id}`}
                    className="rounded-full bg-white/70 px-3 py-1 font-medium text-plum shadow-glass"
                  >
                    Elegir otra opción
                  </Link>
                  <button
                    type="button"
                    onClick={() => quitarItemSinStock(item.id)}
                    disabled={quitandoItemId === item.id}
                    className="rounded-full bg-white/70 px-3 py-1 font-medium text-plum shadow-glass disabled:opacity-50"
                  >
                    {quitandoItemId === item.id ? "Quitando..." : "Quitar del carrito"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-white/50 pt-3 text-sm text-plum-soft">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <span>S/ {costoEnvio.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex justify-between border-t border-white/50 pt-3 font-display text-lg font-semibold text-plum">
        <span>Total</span>
        <span>S/ {(total + costoEnvio).toFixed(2)}</span>
      </div>
    </>
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-28 md:grid-cols-[1.4fr_1fr] md:pb-16">
      <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-plum">Datos de entrega</h1>

        <div role="radiogroup" aria-label="Tipo de entrega" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            role="radio"
            aria-checked={form.tipo_entrega === "delivery"}
            onClick={() => setForm({ ...form, tipo_entrega: "delivery" })}
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-glass ${
              form.tipo_entrega === "delivery" ? "bg-berry text-white" : "bg-white/60 text-plum"
            }`}
          >
            Delivery (S/ 10.00)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={form.tipo_entrega === "recojo"}
            onClick={() => setForm({ ...form, tipo_entrega: "recojo" })}
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-glass ${
              form.tipo_entrega === "recojo" ? "bg-berry text-white" : "bg-white/60 text-plum"
            }`}
          >
            Recojo en tienda
          </button>
        </div>

        <div>
          <label htmlFor="chk-nombre" className="sr-only">Nombre completo</label>
          <input
            id="chk-nombre"
            placeholder="Nombre completo"
            required
            maxLength={160}
            value={form.envio_nombre}
            onChange={actualizarTexto("envio_nombre")}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="chk-telefono" className="sr-only">Teléfono</label>
          <input
            id="chk-telefono"
            placeholder="Teléfono"
            required
            inputMode="numeric"
            maxLength={9}
            value={form.envio_telefono}
            onChange={actualizarTelefonoEnvio}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
        </div>

        {form.tipo_entrega === "delivery" && (
          <>
            <div>
              <label htmlFor="chk-direccion" className="sr-only">Dirección</label>
              <input
                id="chk-direccion"
                placeholder="Dirección"
                required
                maxLength={200}
                value={form.envio_direccion}
                onChange={actualizar("envio_direccion")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="chk-distrito" className="sr-only">Distrito</label>
                <input
                  id="chk-distrito"
                  placeholder="Distrito"
                  maxLength={100}
                  value={form.envio_distrito}
                  onChange={actualizarTexto("envio_distrito")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="chk-provincia" className="sr-only">Provincia</label>
                <input
                  id="chk-provincia"
                  placeholder="Provincia"
                  maxLength={100}
                  value={form.envio_provincia}
                  onChange={actualizarTexto("envio_provincia")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="chk-dpto" className="sr-only">Departamento</label>
                <input
                  id="chk-dpto"
                  placeholder="Depto."
                  maxLength={100}
                  value={form.envio_dpto}
                  onChange={actualizarTexto("envio_dpto")}
                  className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="chk-referencia" className="sr-only">Referencia (opcional)</label>
              <input
                id="chk-referencia"
                placeholder="Referencia (opcional)"
                maxLength={200}
                value={form.envio_referencia}
                onChange={actualizar("envio_referencia")}
                className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
          </>
        )}

        <div>
          <span id="metodo-pago-label" className="mb-2 block text-sm font-medium text-plum">Método de pago</span>
          <div role="radiogroup" aria-labelledby="metodo-pago-label" className="flex gap-2">
            {METODOS.map((m) => (
              <button
                type="button"
                role="radio"
                aria-checked={form.metodo_pago === m.id}
                key={m.id}
                onClick={() => setForm({ ...form, metodo_pago: m.id })}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow-glass ${
                  form.metodo_pago === m.id ? "bg-berry text-white" : "bg-white/60 text-plum"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="glass mt-3 rounded-2xl p-4 text-sm text-plum-soft" aria-live="polite">
            {form.metodo_pago === "yape" ? (
              <p>
                Al confirmar tu pedido se abrirá una ventana para que ingreses tu número de Yape
                y el código de aprobación de 6 dígitos que te llega en la app. El pago se
                verifica al instante.
              </p>
            ) : (
              <p>
                Al confirmar tu pedido se abrirá un formulario seguro para pagar con tarjeta
                Visa o Mastercard. Nunca guardamos tu número de tarjeta ni el CVV.
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="chk-nota" className="sr-only">Nota para tu pedido (opcional)</label>
          <textarea
            id="chk-nota"
            placeholder="Nota para tu pedido (opcional)"
            maxLength={500}
            value={form.nota}
            onChange={actualizar("nota")}
            rows={2}
            className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Confirmando pedido..." : "Confirmar y pagar"}
        </button>
      </form>

      <aside className="glass hidden h-fit space-y-3 rounded-3xl p-6 shadow-glass md:sticky md:top-24 md:block md:self-start">
        {resumenContenido}
      </aside>

      {/* Mobile: barra fija con el total, siempre visible mientras se hace
          scroll por el formulario, con un toggle para expandir y ver el
          desglose completo (mismo contenido que la columna de desktop). */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        {resumenAbierto && (
          <div className="glass-strong max-h-[60vh] space-y-3 overflow-y-auto rounded-t-3xl border-b border-white/40 p-5 shadow-glass-lg">
            {resumenContenido}
          </div>
        )}
        <button
          type="button"
          onClick={() => setResumenAbierto((abierto) => !abierto)}
          aria-expanded={resumenAbierto}
          className="glass-strong flex w-full items-center justify-between rounded-t-3xl border-t border-white/50 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-glass-lg"
        >
          <span className="text-sm font-medium text-plum">
            {resumenAbierto ? "Ocultar resumen ▴" : `Ver resumen (${items.length} ${items.length === 1 ? "producto" : "productos"}) ▾`}
          </span>
          <span className="font-display text-lg font-semibold text-plum">
            S/ {(total + costoEnvio).toFixed(2)}
          </span>
        </button>
      </div>
    </div>
  );
}
