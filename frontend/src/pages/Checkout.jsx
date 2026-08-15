import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { IconUpload } from "../components/Icons.jsx";
import { soloTexto, soloNumeros } from "../validacion.js";

const METODOS = [
  { id: "yape", label: "Yape" },
  { id: "tarjeta", label: "Tarjeta" },
];

export default function Checkout() {
  const { items, total, vaciarLocal } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [configYape, setConfigYape] = useState(null);

  useEffect(() => {
    api.configPagoPublica().then(setConfigYape).catch(() => {});
  }, []);

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
  const [comprobante, setComprobante] = useState(null);
  const [previewComprobante, setPreviewComprobante] = useState(null);

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

  const elegirComprobante = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setComprobante(archivo);
    setPreviewComprobante(URL.createObjectURL(archivo));
    setError("");
  };

  const actualizar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const actualizarTexto = (campo) => (e) => setForm({ ...form, [campo]: soloTexto(e.target.value) });
  const actualizarTelefonoEnvio = (e) => setForm({ ...form, envio_telefono: soloNumeros(e.target.value) });

  const costoEnvio = form.tipo_entrega === "delivery" ? 10 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      // 1) Se crea el pedido (reserva el stock, calcula el total) con
      //    estado_pago "pendiente". El comprobante es opcional acá: solo se
      //    manda si el cliente prefiere ese camino manual desde el inicio.
      const pedido = await api.checkout(
        { ...form, idempotency_key: idempotencyKey },
        comprobante
      );
      try {
        sessionStorage.removeItem("ans_checkout_idempotency_key");
      } catch {
        // no-op: si sessionStorage no está disponible tampoco se llegó a usar
      }
      vaciarLocal();

      // 2) Si ya se pagó (por ejemplo, subió comprobante y quedó en
      //    revisión) o el pago se coordina de otra forma, no hace falta ir
      //    a la pasarela. Si no, intentamos iniciar el cobro automático con
      //    TuPay y redirigimos al cliente a completarlo ahí.
      if (pedido.estado_pago === "pendiente") {
        try {
          const pago = await api.iniciarPago(pedido.id);
          if (pago.redirect_url) {
            window.location.href = pago.redirect_url;
            return;
          }
        } catch {
          // El cobro automático no está disponible todavía (por ejemplo,
          // TuPay sin configurar en el backend). El pedido ya quedó
          // creado — lo mandamos al detalle, donde puede completar el
          // pago manualmente (comprobante de Yape) o esperar contacto.
        }
      }

      navigate(`/pedidos/${pedido.id}`);
    } catch (err) {
      setError(err.message);
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

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-16 md:grid-cols-[1.4fr_1fr]">
      <form onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-plum">Datos de entrega</h1>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo_entrega: "delivery" })}
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-glass ${
              form.tipo_entrega === "delivery" ? "bg-berry text-white" : "bg-white/60 text-plum"
            }`}
          >
            Delivery (S/ 10.00)
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo_entrega: "recojo" })}
            className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-glass ${
              form.tipo_entrega === "recojo" ? "bg-berry text-white" : "bg-white/60 text-plum"
            }`}
          >
            Recojo en tienda
          </button>
        </div>

        <input
          placeholder="Nombre completo"
          required
          maxLength={160}
          value={form.envio_nombre}
          onChange={actualizarTexto("envio_nombre")}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />
        <input
          placeholder="Teléfono"
          required
          inputMode="numeric"
          maxLength={9}
          value={form.envio_telefono}
          onChange={actualizarTelefonoEnvio}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />

        {form.tipo_entrega === "delivery" && (
          <>
            <input
              placeholder="Dirección"
              required
              maxLength={200}
              value={form.envio_direccion}
              onChange={actualizar("envio_direccion")}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="Distrito"
                maxLength={100}
                value={form.envio_distrito}
                onChange={actualizarTexto("envio_distrito")}
                className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Provincia"
                maxLength={100}
                value={form.envio_provincia}
                onChange={actualizarTexto("envio_provincia")}
                className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Depto."
                maxLength={100}
                value={form.envio_dpto}
                onChange={actualizarTexto("envio_dpto")}
                className="rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
              />
            </div>
            <input
              placeholder="Referencia (opcional)"
              maxLength={200}
              value={form.envio_referencia}
              onChange={actualizar("envio_referencia")}
              className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
            />
          </>
        )}

        <div>
          <span className="mb-2 block text-sm font-medium text-plum">Método de pago</span>
          <div className="flex gap-2">
            {METODOS.map((m) => (
              <button
                type="button"
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

          <div className="glass mt-3 rounded-2xl p-4 text-sm text-plum-soft">
            {form.metodo_pago === "yape" ? (
              <p>
                Al confirmar tu pedido te llevaremos a Yape para que ingreses tu número y el
                código de aprobación. El pago se verifica al instante.
              </p>
            ) : (
              <p>
                Al confirmar tu pedido te llevaremos a un formulario seguro para pagar con
                tarjeta Visa o Mastercard. Nunca guardamos tu número de tarjeta ni el CVV.
              </p>
            )}
          </div>

          {form.metodo_pago === "yape" && (
            <details className="glass mt-3 rounded-2xl p-4">
              <summary className="cursor-pointer text-sm font-medium text-plum">
                ¿Prefieres yapear directamente y enviar tu captura? (opcional)
              </summary>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                  {configYape?.yape_qr_url ? (
                    <div className="rounded-2xl bg-white p-3 shadow-glass">
                      <img
                        src={configYape.yape_qr_url}
                        alt="QR de Yape para escanear"
                        className="h-56 w-56 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-white/60 text-center text-xs text-plum-soft">
                      QR no configurado
                    </div>
                  )}
                  <div className="text-sm text-plum-soft">
                    <p>
                      Yapea a: <strong className="text-plum">{configYape?.yape_numero || "—"}</strong>
                    </p>
                    <p>A nombre de: {configYape?.yape_titular || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-plum">Sube la captura de tu pago</p>
                  <div className="flex items-center gap-3">
                    {previewComprobante ? (
                      <img
                        src={previewComprobante}
                        alt="Vista previa del comprobante"
                        className="h-16 w-16 rounded-xl object-cover shadow-glass"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/60 text-plum-soft shadow-glass">
                        <IconUpload size={20} />
                      </div>
                    )}
                    <label className="glass flex-1 cursor-pointer rounded-2xl px-4 py-2.5 text-center text-sm text-plum shadow-glass hover:bg-white">
                      {comprobante ? "Cambiar captura" : "Elegir captura"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={elegirComprobante}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </details>
          )}
        </div>

        <textarea
          placeholder="Nota para tu pedido (opcional)"
          maxLength={500}
          value={form.nota}
          onChange={actualizar("nota")}
          rows={2}
          className="w-full rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
        />

        {error && <p className="text-sm text-berry-dark">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full bg-berry py-3 font-semibold text-white shadow-glass-lg transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Confirmando pedido..." : "Confirmar y pagar"}
        </button>
      </form>

      <aside className="glass h-fit space-y-3 rounded-3xl p-6 shadow-glass">
        <h2 className="font-display text-lg font-semibold text-plum">Resumen</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-plum-soft">
            <span>
              {item.cantidad}× {item.producto.nombre}
            </span>
            <span>S/ {item.subtotal.toFixed(2)}</span>
          </div>
        ))}
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
      </aside>
    </div>
  );
}
