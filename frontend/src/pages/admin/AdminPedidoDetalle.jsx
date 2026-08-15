import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { ESTADOS_PEDIDO } from "./estadosPedido.js";

export default function AdminPedidoDetalle() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [envio, setEnvio] = useState({ empresa_envio: "", numero_seguimiento: "" });
  const [guardandoEnvio, setGuardandoEnvio] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");

  const cargar = () =>
    api.adminPedido(id).then((data) => {
      setPedido(data);
      setEnvio({
        empresa_envio: data.empresa_envio || "",
        numero_seguimiento: data.numero_seguimiento || "",
      });
    });

  useEffect(() => {
    cargar();
  }, [id]);

  const guardarEnvio = async (e) => {
    e.preventDefault();
    setGuardandoEnvio(true);
    setMensajeEnvio("");
    try {
      await api.adminActualizarEnvio(id, envio);
      setMensajeEnvio("Datos de envío guardados.");
      cargar();
    } catch (err) {
      setMensajeEnvio(err.message);
    } finally {
      setGuardandoEnvio(false);
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === "cancelado") {
      const confirmado = window.confirm(
        "¿Desea cancelar esta compra? El stock de los productos se devolverá. " +
          "Si se cancela, se cancela y ya — esta acción no tiene vuelta atrás."
      );
      if (!confirmado) return;
    }

    setActualizando(true);
    try {
      await api.adminCambiarEstadoPedido(id, nuevoEstado);
      cargar();
    } finally {
      setActualizando(false);
    }
  };

  const revisarPago = async (estadoPago) => {
    setActualizando(true);
    try {
      await api.adminRevisarPago(id, estadoPago);
      cargar();
    } finally {
      setActualizando(false);
    }
  };

  if (!pedido) {
    return <p className="text-plum-soft">Cargando pedido...</p>;
  }

  return (
    <div>
      <Link to="/admin/pedidos" className="text-sm text-berry hover:underline">
        ← Volver a pedidos
      </Link>

      <div className="glass mt-4 rounded-3xl p-6 shadow-glass sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-plum">{pedido.numero_pedido}</h1>
            <p className="text-sm text-plum-soft">
              {new Date(pedido.fecha_creacion).toLocaleString("es-PE")}
            </p>
          </div>
          {pedido.estado === "cancelado" ? (
            <span className="rounded-full bg-plum/10 px-4 py-2 text-sm font-semibold text-plum-soft">
              Cancelado — no se puede modificar
            </span>
          ) : (
            <select
              value={pedido.estado}
              disabled={actualizando}
              onChange={(e) => cambiarEstado(e.target.value)}
              className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-glass focus:outline-none"
            >
              {Object.entries(ESTADOS_PEDIDO).map(([valor, label]) => (
                <option key={valor} value={valor} className="text-plum">
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
              Cuenta del cliente
            </h2>
            <p className="text-plum">{pedido.cliente}</p>
            <p className="text-sm text-plum-soft">{pedido.cliente_email}</p>
            <p className="text-xs text-plum-soft/70">
              (datos actuales de la cuenta — pueden diferir de los del pedido)
            </p>
          </div>
          <div>
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
              Entrega (datos del pedido)
            </h2>
            <p className="text-plum">{pedido.tipo_entrega === "delivery" ? "Delivery" : "Recojo en tienda"}</p>
            <p className="text-sm text-plum-soft">{pedido.envio_nombre} · {pedido.envio_telefono}</p>
            {pedido.envio_direccion && (
              <p className="text-sm text-plum-soft">
                {pedido.envio_direccion}, {pedido.envio_distrito}
                {pedido.envio_provincia && `, ${pedido.envio_provincia}`}
                {pedido.envio_dpto && `, ${pedido.envio_dpto}`}
              </p>
            )}
            {pedido.envio_referencia && (
              <p className="text-sm text-plum-soft">Ref: {pedido.envio_referencia}</p>
            )}
            <p className="mt-1 text-sm text-plum-soft">Pago: {pedido.metodo_pago_label}</p>
            {pedido.nota && (
              <p className="mt-1 text-sm text-plum-soft">Nota del cliente: {pedido.nota}</p>
            )}
          </div>
        </div>

        {pedido.estado_pago !== "no_aplica" && (
          <div className="mt-6 rounded-2xl bg-white/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
                {pedido.metodo_pago === "yape" ? "Comprobante de pago" : "Seguimiento de pago"}
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  pedido.estado_pago === "reembolso_pendiente"
                    ? "bg-gold/30 text-plum"
                    : pedido.estado_pago === "reembolsado"
                    ? "bg-plum/10 text-plum-soft"
                    : "bg-berry/10 text-berry-dark"
                }`}
              >
                {pedido.estado_pago_label}
              </span>
            </div>

            {pedido.metodo_pago === "tarjeta" && pedido.tarjeta_ultimos4 && (
              <p className="mt-2 text-sm text-plum-soft">
                Tarjeta terminada en <strong className="text-plum">{pedido.tarjeta_ultimos4}</strong> · Titular: {pedido.tarjeta_titular}
              </p>
            )}

            {pedido.metodo_pago === "yape" && (
              pedido.comprobante_url ? (
                <a href={pedido.comprobante_url} target="_blank" rel="noreferrer">
                  <img
                    src={pedido.comprobante_url}
                    alt="Comprobante de pago"
                    className="mt-3 h-40 w-40 rounded-xl object-cover shadow-glass transition hover:opacity-90"
                  />
                </a>
              ) : (
                <p className="mt-2 text-sm text-plum-soft">El cliente todavía no sube su comprobante.</p>
              )
            )}

            {pedido.estado !== "cancelado" &&
              (pedido.estado_pago === "en_revision" || (pedido.metodo_pago === "tarjeta" && pedido.estado_pago === "pendiente")) && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => revisarPago("verificado")}
                  disabled={actualizando}
                  className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
                >
                  Verificar pago
                </button>
                <button
                  onClick={() => revisarPago("rechazado")}
                  disabled={actualizando}
                  className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-plum shadow-glass hover:bg-white disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            )}

            {pedido.estado_pago === "reembolso_pendiente" && (
              <div className="mt-3">
                <p className="mb-2 text-sm text-plum-soft">
                  Este pedido se canceló después de que el pago ya estaba verificado —
                  hay que devolverle el dinero al cliente por fuera del sistema
                  (Yape, transferencia, etc.) y luego marcarlo aquí.
                </p>
                <button
                  onClick={() => revisarPago("reembolsado")}
                  disabled={actualizando}
                  className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
                >
                  Marcar como reembolsado
                </button>
              </div>
            )}
          </div>
        )}

        {pedido.estado !== "cancelado" && (
          <form onSubmit={guardarEnvio} className="mt-6 rounded-2xl bg-white/50 p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-plum-soft">
              Seguimiento de envío
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                placeholder="Empresa de envío (ej: Olva Courier)"
                maxLength={100}
                value={envio.empresa_envio}
                onChange={(e) => setEnvio({ ...envio, empresa_envio: e.target.value })}
                className="rounded-2xl bg-white/80 px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
              />
              <input
                placeholder="Número de seguimiento"
                maxLength={100}
                value={envio.numero_seguimiento}
                onChange={(e) => setEnvio({ ...envio, numero_seguimiento: e.target.value })}
                className="rounded-2xl bg-white/80 px-4 py-2 text-sm text-plum shadow-glass focus:outline-none"
              />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={guardandoEnvio}
                className="rounded-full bg-berry px-4 py-2 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark disabled:opacity-60"
              >
                {guardandoEnvio ? "Guardando..." : "Guardar seguimiento"}
              </button>
              {mensajeEnvio && <span className="text-sm text-plum-soft">{mensajeEnvio}</span>}
            </div>
          </form>
        )}

        <div className="mt-6 space-y-2 border-t border-white/50 pt-4">
          {pedido.detalles.map((d) => (
            <div key={d.id} className="flex justify-between text-sm text-plum-soft">
              <span>
                {d.cantidad}× {d.producto_nombre}
                {d.talla && ` · Talla ${d.talla}`}
                {d.color && ` · ${d.color}`}
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
      </div>
    </div>
  );
}
