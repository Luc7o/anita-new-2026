import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { abrirCulqiCheckout } from "../culqi.js";
import { obtenerPagoIdempotencyKey, limpiarPagoIdempotencyKey } from "../pagoIdempotencia.js";
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

// Métodos que se cobran por la pasarela Culqi (ver app/utils/culqi.py en
// el backend). Tarjeta y Yape se pagan SIEMPRE por acá.
const METODOS_PASARELA = new Set(["tarjeta", "yape"]);

export default function PedidoDetalle() {
  const { id } = useParams();
  const { usuario, setUsuario } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState("");
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const [descargandoBoleta, setDescargandoBoleta] = useState(false);
  const [errorBoleta, setErrorBoleta] = useState("");

  // Checkout como invitado: se ofrece (nunca se exige) ponerle contraseña a
  // la cuenta acá, en la confirmación, después de que la compra ya se hizo.
  const [ofrecerCuentaVisible, setOfrecerCuentaVisible] = useState(true);
  const [passwordCuenta, setPasswordCuenta] = useState("");
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState("");
  const [cuentaCreada, setCuentaCreada] = useState(false);

  const cargar = () => api.pedido(id).then(setPedido);

  useEffect(() => {
    cargar();
  }, [id]);

  const pagar = async () => {
    setPagando(true);
    setErrorPago("");
    try {
      const { tokenId, email } = await abrirCulqiCheckout({
        amountCentavos: Math.round(pedido.total * 100),
        email: usuario?.email,
        metodoPago: pedido.metodo_pago,
      });
      const idempotencyKeyPago = obtenerPagoIdempotencyKey(id);
      const actualizado = await api.pagarPedido(id, {
        token_id: tokenId,
        email,
        idempotency_key: idempotencyKeyPago,
      });
      limpiarPagoIdempotencyKey(id);
      setPedido(actualizado);
    } catch (err) {
      setErrorPago(err.message);
    } finally {
      setPagando(false);
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

  const crearPasswordCuenta = async (e) => {
    e.preventDefault();
    setErrorCuenta("");
    setCreandoCuenta(true);
    try {
      const actualizado = await api.completarCuenta({ password: passwordCuenta });
      setUsuario(actualizado);
      setCuentaCreada(true);
    } catch (err) {
      setErrorCuenta(err.message);
    } finally {
      setCreandoCuenta(false);
    }
  };

  const descargarBoleta = async () => {
    setDescargandoBoleta(true);
    setErrorBoleta("");
    try {
      await api.boletaPedido(pedido.id, pedido.numero_pedido);
    } catch (err) {
      setErrorBoleta(err.message);
    } finally {
      setDescargandoBoleta(false);
    }
  };

  if (!pedido) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-plum-soft">Cargando pedido...</p>;
  }

  const mostrarEstadoPago = pedido.estado_pago !== "no_aplica";
  const sePuedeCancelar = !["enviado", "entregado", "cancelado"].includes(pedido.estado);
  const puedePagarConPasarela =
    METODOS_PASARELA.has(pedido.metodo_pago) &&
    pedido.estado !== "cancelado" &&
    pedido.estado_pago === "pendiente";

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

        {usuario?.es_invitado && ofrecerCuentaVisible && (
          <div className="glass relative mt-5 rounded-2xl border border-berry/20 p-5 shadow-glass">
            <button
              type="button"
              onClick={() => setOfrecerCuentaVisible(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 text-plum-soft transition hover:text-plum"
            >
              ✕
            </button>

            {cuentaCreada ? (
              <p className="pr-6 text-sm text-plum">
                Listo, ya puedes ingresar con <span className="font-semibold">{usuario.email}</span> y
                tu nueva contraseña cuando quieras.
              </p>
            ) : (
              <form onSubmit={crearPasswordCuenta} className="pr-6">
                <p className="font-display text-sm font-semibold text-plum">
                  Guarda tu cuenta para la próxima
                </p>
                <p className="mt-0.5 text-xs text-plum-soft">
                  Ponle una contraseña a <span className="font-medium">{usuario.email}</span> y podrás
                  ver este y tus próximos pedidos sin volver a llenar tus datos. Es opcional.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="pwd-cuenta" className="sr-only">Nueva contraseña</label>
                  <input
                    id="pwd-cuenta"
                    type="password"
                    placeholder="Nueva contraseña"
                    minLength={6}
                    required
                    value={passwordCuenta}
                    onChange={(e) => setPasswordCuenta(e.target.value)}
                    className="w-full flex-1 rounded-2xl bg-white/70 px-4 py-2.5 text-plum shadow-glass focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={creandoCuenta}
                    className="shrink-0 rounded-full bg-berry px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creandoCuenta ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                {errorCuenta && (
                  <p className="mt-2 text-sm text-berry-dark" role="alert">
                    {errorCuenta}
                  </p>
                )}
              </form>
            )}
          </div>
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
                <button
                  onClick={pagar}
                  disabled={pagando}
                  className="w-full rounded-full bg-berry py-3 text-center font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
                >
                  {pagando ? "Conectando con la pasarela..." : `Pagar con ${pedido.metodo_pago_label}`}
                </button>
                {errorPago && <p className="mt-2 text-sm text-berry-dark">{errorPago}</p>}
              </div>
            )}

            {pedido.comprobante_url && (
              <img
                src={pedido.comprobante_url}
                alt="Comprobante de pago"
                className="mt-3 h-32 w-32 rounded-xl object-cover shadow-glass"
              />
            )}

            {pedido.estado_pago === "en_revision" && (
              <p className="mt-3 text-sm text-plum-soft">
                Tu pago está en revisión. Te avisaremos apenas se confirme.
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

        {pedido.estado_pago === "verificado" && (
          <div className="mt-4">
            <button
              onClick={descargarBoleta}
              disabled={descargandoBoleta}
              className="w-full rounded-full bg-white/70 py-3 text-center font-semibold text-berry-dark shadow-glass transition hover:bg-white disabled:opacity-60"
            >
              {descargandoBoleta ? "Generando boleta..." : "Descargar boleta"}
            </button>
            {errorBoleta && <p className="mt-2 text-center text-sm text-berry-dark">{errorBoleta}</p>}
          </div>
        )}

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
