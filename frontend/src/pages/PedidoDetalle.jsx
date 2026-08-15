import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { IconUpload } from "../components/Icons.jsx";
import SeguimientoPedido from "../components/SeguimientoPedido.jsx";

const ESTADO_PAGO_ESTILOS = {
  pendiente: "bg-gold/20 text-plum",
  en_revision: "bg-gold/20 text-plum",
  verificado: "bg-berry/10 text-berry-dark",
  rechazado: "bg-red-100 text-red-700",
  no_aplica: "bg-plum/10 text-plum-soft",
  reembolso_pendiente: "bg-gold/20 text-plum",
  reembolsado: "bg-plum/10 text-plum-soft",
};

// Métodos que se cobran automáticamente a través de TuPay (ver
// app/utils/tupay.py en el backend). Yape también puede completarse a mano
// subiendo un comprobante, por eso mantiene su propio flujo abajo.
const METODOS_TUPAY = new Set(["tarjeta", "yape"]);

export default function PedidoDetalle() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [pedido, setPedido] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState("");
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState("");

  const cargar = () => api.pedido(id).then(setPedido);

  useEffect(() => {
    cargar();
  }, [id]);

  // Cuando TuPay redirige de vuelta (success_url/back_url/error_url llevan
  // a esta misma página con ?pago=...), la notificación real puede tardar
  // unos segundos en llegar por el webhook — reconsultamos el pedido una
  // vez más después de un momento para reflejar el estado ya actualizado.
  useEffect(() => {
    if (searchParams.get("pago")) {
      const t = setTimeout(cargar, 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  const iniciarPago = async () => {
    setPagando(true);
    setErrorPago("");
    try {
      const pago = await api.iniciarPago(id);
      if (pago.redirect_url) {
        window.location.href = pago.redirect_url;
        return;
      }
      setErrorPago("No se recibió un enlace de pago. Intenta de nuevo en unos minutos.");
    } catch (err) {
      setErrorPago(err.message);
    } finally {
      setPagando(false);
    }
  };

  const subirComprobante = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    try {
      await api.subirComprobante(id, archivo);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const cancelarPedido = async () => {
    const confirmado = window.confirm(
      "¿Deseas cancelar este pedido? Esta acción no se puede deshacer."
    );
    if (!confirmado) return;

    setCancelando(true);
    setErrorCancelar("");
    try {
      await api.cancelarPedido(id);
      cargar();
    } catch (err) {
      setErrorCancelar(err.message);
    } finally {
      setCancelando(false);
    }
  };

  if (!pedido) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-plum-soft">Cargando pedido...</p>;
  }

  const necesitaComprobante = pedido.metodo_pago === "yape";
  const mostrarEstadoPago = pedido.estado_pago !== "no_aplica";
  const sePuedeCancelar = !["enviado", "entregado", "cancelado"].includes(pedido.estado);
  const puedePagarConPasarela =
    METODOS_TUPAY.has(pedido.metodo_pago) &&
    pedido.estado !== "cancelado" &&
    (pedido.estado_pago === "pendiente" || pedido.estado_pago === "rechazado");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="glass rounded-3xl p-8 shadow-glass-lg">
        <span className="rounded-full bg-berry/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-berry-dark">
          {pedido.estado_label}
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-plum">
          ¡Gracias por tu compra!
        </h1>
        <p className="mt-1 text-sm text-plum-soft">
          Pedido {pedido.numero_pedido} · Pago con {pedido.metodo_pago_label}
        </p>

        {searchParams.get("pago") === "error" && (
          <p className="mt-3 rounded-2xl bg-red-100 px-4 py-2.5 text-sm text-red-700">
            Hubo un problema al procesar tu pago. Puedes intentarlo de nuevo abajo.
          </p>
        )}
        {searchParams.get("pago") === "cancelado" && (
          <p className="mt-3 rounded-2xl bg-gold/20 px-4 py-2.5 text-sm text-plum">
            Cancelaste el pago. Puedes retomarlo cuando quieras desde aquí.
          </p>
        )}

        <div className="mt-6">
          <SeguimientoPedido pedido={pedido} />
        </div>

        {mostrarEstadoPago && (
          <div className="mt-5 rounded-2xl bg-white/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-plum">Estado del pago</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_PAGO_ESTILOS[pedido.estado_pago]}`}>
                {pedido.estado_pago_label}
              </span>
            </div>

            {puedePagarConPasarela && (
              <div className="mt-3">
                {pedido.estado_pago === "rechazado" && (
                  <p className="mb-2 text-sm text-berry-dark">
                    Tu pago anterior no pudo completarse. Intenta de nuevo.
                  </p>
                )}
                <button
                  onClick={iniciarPago}
                  disabled={pagando}
                  className="w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
                >
                  {pagando
                    ? "Conectando con la pasarela..."
                    : `Pagar con ${pedido.metodo_pago_label}`}
                </button>
                {errorPago && <p className="mt-2 text-sm text-berry-dark">{errorPago}</p>}
              </div>
            )}

            {necesitaComprobante && pedido.comprobante_url && (
              <img
                src={pedido.comprobante_url}
                alt="Comprobante de pago"
                className="mt-3 h-32 w-32 rounded-xl object-cover shadow-glass"
              />
            )}

            {necesitaComprobante && pedido.estado !== "cancelado" &&
              (pedido.estado_pago === "pendiente" || pedido.estado_pago === "rechazado") && (
              <div className="mt-3">
                <p className="mb-2 text-sm text-plum-soft">
                  ¿Prefieres que revisemos tu comprobante manualmente en vez de pagar arriba?
                </p>
                <label className="glass flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-plum shadow-glass hover:bg-white">
                  <IconUpload size={16} />
                  {subiendo ? "Subiendo..." : "Subir comprobante de pago"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={subirComprobante}
                    disabled={subiendo}
                    className="hidden"
                  />
                </label>
                {error && <p className="mt-2 text-sm text-berry-dark">{error}</p>}
              </div>
            )}

            {necesitaComprobante && pedido.estado_pago === "en_revision" && (
              <p className="mt-3 text-sm text-plum-soft">
                Recibimos tu comprobante, lo estamos revisando. Te avisaremos apenas se confirme.
              </p>
            )}

            {pedido.estado_pago === "reembolso_pendiente" && (
              <p className="mt-3 text-sm text-plum-soft">
                Como ya habías pagado, te vamos a devolver tu dinero. Nos pondremos en
                contacto contigo para coordinarlo.
              </p>
            )}
            {pedido.estado_pago === "reembolsado" && (
              <p className="mt-3 text-sm text-plum-soft">Tu reembolso ya fue procesado.</p>
            )}
          </div>
        )}

        {pedido.tipo_entrega && (
          <div className="mt-6 rounded-2xl bg-white/50 p-4 text-sm text-plum-soft">
            <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
              Datos de entrega
            </h2>
            <p>{pedido.tipo_entrega === "delivery" ? "Delivery" : "Recojo en tienda"}</p>
            <p>{pedido.envio_nombre} · {pedido.envio_telefono}</p>
            {pedido.envio_direccion && (
              <p>
                {pedido.envio_direccion}, {pedido.envio_distrito}
                {pedido.envio_provincia && `, ${pedido.envio_provincia}`}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-2">
          {pedido.detalles.map((d) => (
            <div key={d.id} className="flex justify-between text-sm text-plum-soft">
              <span>
                {d.cantidad}× {d.producto_nombre}
              </span>
              <span>S/ {d.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t border-white/50 pt-4 text-sm text-plum-soft">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>S/ {pedido.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>S/ {pedido.costo_envio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-display text-base font-semibold text-plum">
            <span>Total</span>
            <span>S/ {pedido.total.toFixed(2)}</span>
          </div>
        </div>

        {sePuedeCancelar && (
          <div className="mt-4">
            <button
              onClick={cancelarPedido}
              disabled={cancelando}
              className="w-full rounded-full bg-white/70 py-3 text-center font-semibold text-berry-dark shadow-glass transition hover:bg-white disabled:opacity-60"
            >
              {cancelando ? "Cancelando..." : "Cancelar pedido"}
            </button>
            {errorCancelar && <p className="mt-2 text-center text-sm text-berry-dark">{errorCancelar}</p>}
          </div>
        )}

        <Link
          to="/tienda"
          className="mt-3 block w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
