import { rutaAdmin } from "../../lib/appMode.js";
import { useConfirm } from "../../components/ConfirmDialog.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Spinner from "../../components/Spinner.jsx";
import { SkeletonDetalleAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { ESTADOS_PEDIDO } from "./estadosPedido.js";
import EstadoPedidoSelect from "../../components/EstadoPedidoSelect.jsx";
import LineaAvancePedido from "../../components/admin/LineaAvancePedido.jsx";
import { InsigniaEstadoPedido, InsigniaEntregaPedido } from "../../components/admin/InsigniasPedido.jsx";
import { LineasPedido, TotalesPedido } from "../../components/ResumenPedido.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ALMACEN, VENTAS, PUEDE_GESTIONAR_PEDIDOS, PUEDE_GESTIONAR_REEMBOLSOS } from "../../roles.js";

export default function AdminPedidoDetalle() {
  const { usuario } = useAuth();
  // Administrativo solo mira pedidos. Almacén puede preparar/despachar,
  // pero las entregas finales y la revisión de pagos no le corresponden.
  const puedeGestionarRol = PUEDE_GESTIONAR_PEDIDOS.includes(usuario?.rol);
  const puedeRevisarPagoRol = PUEDE_GESTIONAR_REEMBOLSOS.includes(usuario?.rol);
  const toast = useToast();
  const confirmar = useConfirm();
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  // Ventas VE todos los pedidos, pero solo gestiona los online con delivery
  // (el backend también lo exige). En los demás queda en modo lectura.
  const ventasSoloLectura =
    usuario?.rol === VENTAS && !!pedido && !(pedido.tipo_entrega === "delivery" && pedido.origen === "online");
  const puedeGestionar = puedeGestionarRol && !ventasSoloLectura;
  const puedeRevisarPago = puedeRevisarPagoRol && !ventasSoloLectura;
  const [actualizando, setActualizando] = useState(false);
  const [descargandoBoleta, setDescargandoBoleta] = useState(false);
  const [errorBoleta, setErrorBoleta] = useState("");
  // Código de 6 dígitos que el cliente dice en la tienda para retirar su pedido
  const [codigoRecojo, setCodigoRecojo] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");

  const cargar = () =>
    api.adminPedido(id).then((data) => {
      setPedido(data);
    });

  useEffect(() => {
    cargar();
  }, [id]);

  const cambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === "cancelado") {
      const confirmado = await confirmar({
        title: "¿Cancelar esta compra?",
        message: "El stock de los productos se devolverá. Esta acción no tiene vuelta atrás.",
        tone: "danger",
        confirmText: "Sí, cancelar compra",
        cancelText: "No, volver",
      });
      if (!confirmado) return;
    }

    setActualizando(true);
    try {
      await api.adminCambiarEstadoPedido(id, nuevoEstado);
      toast.success("Estado del pedido actualizado");
      cargar();
    } finally {
      setActualizando(false);
    }
  };

  const entregarRecojo = async (e) => {
    e.preventDefault();
    setErrorCodigo("");
    setActualizando(true);
    try {
      await api.adminCambiarEstadoPedido(id, "entregado", codigoRecojo);
      toast.success("Pedido entregado al cliente");
      setCodigoRecojo("");
      cargar();
    } catch (err) {
      // Código incorrecto u otro error: se muestra junto al campo
      setErrorCodigo(err.message);
    } finally {
      setActualizando(false);
    }
  };

  // Almacén solo puede avanzar el flujo logístico y nunca marcar "Entregado".
  // Se conserva el estado actual en el selector para que pueda visualizarse.
  // Esta restricción también se verifica en el backend.
  const esAlmacen = usuario?.rol === ALMACEN;
  const siguienteEstadoAlmacen = pedido?.estado === "confirmado"
    ? "preparando"
    : pedido?.estado === "preparando"
      ? (pedido.requiere_codigo_recojo ? "listo_recojo" : "enviado")
      : null;

  // Otros roles mantienen el flujo que tenían antes de este cambio.
  const opcionesEstado = Object.fromEntries(
    Object.entries(ESTADOS_PEDIDO).filter(([k]) => {
      if (esAlmacen) return k === pedido?.estado || k === siguienteEstadoAlmacen;
      if (k === "cancelado" && !puedeRevisarPago) return false;
      if (pedido?.requiere_codigo_recojo && pedido.estado !== "enviado") {
        if (k === "enviado") return false;
        if (k === "entregado" && pedido.estado !== "entregado") return false;
      } else if (k === "listo_recojo" && pedido?.estado !== "listo_recojo") {
        return false;
      }
      return true;
    })
  );

  const revisarPago = async (estadoPago) => {
    setActualizando(true);
    try {
      await api.adminRevisarPago(id, estadoPago);
      toast.success("Pago revisado");
      cargar();
    } finally {
      setActualizando(false);
    }
  };

  const descargarBoleta = async () => {
    setDescargandoBoleta(true);
    setErrorBoleta("");
    try {
      await api.adminBoletaPedido(pedido.id, pedido.numero_pedido);
    } catch (err) {
      setErrorBoleta(err.message);
    } finally {
      setDescargandoBoleta(false);
    }
  };

  if (!pedido) {
    return <SkeletonDetalleAdmin etiqueta="Cargando pedido" />;
  }

  return (
    <div>
      <Link to={rutaAdmin("/pedidos")} className="text-sm text-berry hover:underline">
        ← Volver a pedidos
      </Link>

      <div className="mt-4 space-y-6">
        <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-plum">{pedido.numero_pedido}</h1>
            <p className="text-sm text-plum-soft">
              {new Date(pedido.fecha_creacion).toLocaleString("es-PE")}
              {pedido.origen === "presencial" && (
                <span className="ml-2 rounded-md bg-plum/10 px-2 py-0.5 text-xs font-semibold text-plum-soft">
                  {pedido.origen_label}
                </span>
              )}
            </p>
          </div>
          {pedido.estado === "cancelado" ? (
            <InsigniaEstadoPedido
              estado="cancelado"
              label="Cancelado — no se puede modificar"
              className="!rounded-[10px] !px-4 !py-2 !text-sm"
            />
          ) : !puedeGestionar || (esAlmacen && !siguienteEstadoAlmacen) ? (
            <InsigniaEstadoPedido
              estado={pedido.estado}
              label={pedido.estado_label || pedido.estado}
              className="!rounded-[10px] !px-4 !py-2 !text-sm"
            />
          ) : (
            <EstadoPedidoSelect
              value={pedido.estado}
              opciones={opcionesEstado}
              disabled={actualizando}
              onChange={cambiarEstado}
            />
          )}
        </div>


          {pedido.estado !== "cancelado" && (
            <div className="mt-5 border-t border-plum/10 pt-3">
              <p className="mb-1 text-sm font-bold text-plum">Avance del pedido</p>
              <LineaAvancePedido pedido={pedido} />
            </div>
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-bold text-plum">Productos</h2>
        <LineasPedido detalles={pedido.detalles} conVariantes className="pt-1" />

        <TotalesPedido pedido={pedido} />

        {pedido.estado_pago === "verificado" && (
          <div className="mt-4">
            <button
              onClick={descargarBoleta}
              disabled={descargandoBoleta}
              className="rounded-[10px] border border-plum/20 bg-white px-4 py-2 text-sm font-semibold text-berry-dark transition hover:bg-white disabled:opacity-60"
            >
              {descargandoBoleta ? <><Spinner />Generando boleta...</> : "Descargar boleta"}
            </button>
            {errorBoleta && <p className="mt-2 text-sm text-berry-dark">{errorBoleta}</p>}
          </div>
        )}
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
          <div>
            <h2 className="mb-2 text-sm font-bold text-plum">
              Cuenta del cliente
            </h2>
            <p className="text-plum">{pedido.cliente}</p>
            <p className="text-sm text-plum-soft">{pedido.cliente_email}</p>
            <p className="text-xs text-plum-soft/70">
              (datos actuales de la cuenta — pueden diferir de los del pedido)
            </p>
          </div>
            </div>
            <div className="glass rounded-2xl p-5">
          <div>
            <h2 className="mb-2 text-sm font-bold text-plum">
              Entrega (datos del pedido)
            </h2>
            <InsigniaEntregaPedido pedido={pedido} className="mb-1" />
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
          <div className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-plum">
                {pedido.metodo_pago === "yape" ? "Comprobante de pago" : "Seguimiento de pago"}
              </h2>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
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

            {puedeRevisarPago && pedido.estado !== "cancelado" &&
              (pedido.estado_pago === "en_revision" || (pedido.metodo_pago === "tarjeta" && pedido.estado_pago === "pendiente")) && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => revisarPago("verificado")}
                  disabled={actualizando}
                  className="rounded-[10px] bg-berry px-4 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
                >
                  Verificar pago
                </button>
                <button
                  onClick={() => revisarPago("rechazado")}
                  disabled={actualizando}
                  className="rounded-[10px] border border-plum/20 bg-white px-4 py-2 text-sm font-semibold text-plum hover:bg-white disabled:opacity-60"
                >
                  Rechazar
                </button>
              </div>
            )}

            {puedeRevisarPago && pedido.estado_pago === "reembolso_pendiente" && (
              <div className="mt-3">
                <p className="mb-2 text-sm text-plum-soft">
                  Este pedido se canceló después de que el pago ya estaba verificado —
                  hay que devolverle el dinero al cliente por fuera del sistema
                  (Yape, transferencia, etc.) y luego marcarlo aquí.
                </p>
                <button
                  onClick={() => revisarPago("reembolsado")}
                  disabled={actualizando}
                  className="rounded-[10px] bg-berry px-4 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
                >
                  Marcar como reembolsado
                </button>
              </div>
            )}
          </div>
        )}

        {puedeGestionar && !esAlmacen && pedido.estado === "listo_recojo" && pedido.requiere_codigo_recojo && (
          <form onSubmit={entregarRecojo} className="glass rounded-2xl border-berry/30 p-5">
            <h2 className="mb-1 text-sm font-bold text-plum">
              Entregar al cliente
            </h2>
            <p className="mb-3 text-sm text-plum-soft">
              Pídele al cliente su <strong className="text-plum">código de recojo</strong> (6 dígitos) y
              revisa su {pedido.envio_tipo_documento?.toUpperCase() || "documento"}
              {pedido.envio_numero_documento ? ` ${pedido.envio_numero_documento}` : ""}.
              Solo entrégalo si el código coincide.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="codigo-recojo" className="sr-only">Código de recojo</label>
              <input
                id="codigo-recojo"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="000000"
                value={codigoRecojo}
                onChange={(e) => {
                  setCodigoRecojo(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrorCodigo("");
                }}
                className="w-40 rounded-2xl bg-plum/5 px-4 py-2 text-center font-mono text-lg tracking-[0.3em] text-plum focus:outline-none focus-visible:ring-2 focus-visible:ring-berry"
              />
              <button
                type="submit"
                disabled={actualizando || codigoRecojo.length !== 6}
                className="rounded-[10px] bg-berry px-4 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizando ? <><Spinner />Verificando...</> : "Confirmar entrega"}
              </button>
            </div>
            {errorCodigo && (
              <p className="mt-2 text-sm text-berry-dark" role="alert">{errorCodigo}</p>
            )}
          </form>
        )}

          </div>
        </div>
      </div>
    </div>
  );
}
