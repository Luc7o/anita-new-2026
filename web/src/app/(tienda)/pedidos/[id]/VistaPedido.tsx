"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { descargarArchivo, pedir } from "@/lib/api";
import { abrirCulqiCheckout, claveIdempotenciaPago, CULQI_CERRADO, ErrorCulqi, limpiarClaveIdempotenciaPago } from "@/lib/culqi";
import { soles } from "@/lib/precio";
import { enlaceWhatsApp } from "@/lib/tienda";
import { Girando } from "@/componentes/acceso/Girando";
import { tomarAvisosPendientes } from "@/componentes/Avisos";
import { useSesion } from "@/componentes/cuenta/Sesion";
import { IconoCheck, IconoCopiar, IconoReloj, IconoWhatsApp } from "@/componentes/Iconos";

// Detalle del pedido. Es la página a la que
// llega el checkout después de pagar.

type Detalle = { id: number; cantidad: number; producto_nombre: string; subtotal: number };
type Pedido = {
  id: number;
  numero_pedido: string;
  estado: string;
  estado_label: string;
  estado_pago: string;
  estado_pago_label: string;
  metodo_pago: string;
  metodo_pago_label: string;
  total: number;
  subtotal: number;
  costo_envio: number;
  detalles: Detalle[];
  tipo_entrega?: "delivery" | "recojo" | null;
  envio_nombre?: string;
  envio_telefono?: string;
  envio_direccion?: string | null;
  envio_distrito?: string | null;
  envio_provincia?: string | null;
  envio_tipo_documento?: string | null;
  entrega_estimada_label?: string | null;
  codigo_recojo?: string | null;
  requiere_codigo_recojo?: boolean;
};

const ESTILO_PAGO: Record<string, string> = {
  pendiente: "bg-aviso/15 text-aviso",
  en_revision: "bg-aviso/15 text-aviso",
  verificado: "bg-exito/15 text-exito",
  rechazado: "bg-peligro/15 text-peligro",
  no_aplica: "bg-plum/10 text-plum-soft",
  reembolso_pendiente: "bg-aviso/15 text-aviso",
  reembolsando: "bg-aviso/15 text-aviso",
  reembolsado: "bg-plum/10 text-plum-soft",
};

// Tarjeta y Yape se cobran siempre por la pasarela Culqi (backend/app/utils/culqi.py).
const METODOS_PASARELA = new Set(["tarjeta", "yape"]);
const TERMINADOS = ["enviado", "entregado", "cancelado"];
const mensaje = (e: unknown, porDefecto: string) => (e instanceof Error ? e.message : porDefecto);

const PASOS_BASE = [
  { clave: "pendiente", texto: "Pendiente" },
  { clave: "confirmado", texto: "Confirmado" },
  { clave: "preparando", texto: "Preparando" },
];
const PASOS_DELIVERY = [...PASOS_BASE, { clave: "enviado", texto: "Enviado" }, { clave: "entregado", texto: "Entregado" }];
const PASOS_RECOJO = [...PASOS_BASE, { clave: "listo_recojo", texto: "Listo para recoger" }, { clave: "entregado", texto: "Entregado" }];

function Seguimiento({ pedido }: { pedido: Pedido }) {
  if (pedido.estado === "cancelado") {
    return (
      <p className="border-y border-plum/10 py-4 text-sm font-medium text-plum-soft">Este pedido fue cancelado.</p>
    );
  }
  // Un recojo antiguo que ya estaba "enviado" sigue con la línea de delivery.
  const pasos = pedido.requiere_codigo_recojo && pedido.estado !== "enviado" ? PASOS_RECOJO : PASOS_DELIVERY;
  const actual = pasos.findIndex((p) => p.clave === pedido.estado);
  return (
    <ol className="flex items-center" aria-label="Seguimiento del pedido">
      {pasos.map((paso, i) => {
        const hecho = i <= actual;
        return (
          <Fragment key={paso.clave}>
            <li className="flex flex-col items-center gap-1" aria-current={i === actual ? "step" : undefined}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${hecho ? "bg-plum text-ivory" : "border border-plum/20 text-plum-soft"}`}
                aria-hidden="true"
              >
                {hecho ? "✓" : i + 1}
              </span>
              <span className={`w-16 text-center text-[11px] leading-tight ${hecho ? "font-semibold text-plum" : "text-plum-soft"}`}>{paso.texto}</span>
            </li>
            {i < pasos.length - 1 && <li aria-hidden="true" className={`mb-5 h-px flex-1 ${i < actual ? "bg-plum" : "bg-plum/15"}`} />}
          </Fragment>
        );
      })}
    </ol>
  );
}

export function VistaPedido({ id }: { id: string }) {
  const { usuario, setUsuario, avisar, confirmar } = useSesion();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [ocupado, setOcupado] = useState<"" | "pagar" | "cancelar" | "boleta">("");
  const [errorPago, setErrorPago] = useState("");
  const [errorCancelar, setErrorCancelar] = useState("");
  const [errorBoleta, setErrorBoleta] = useState("");
  const [copiado, setCopiado] = useState(false);
  // Compra como invitado: se OFRECE (nunca se exige) ponerle contraseña a la cuenta.
  const [ofrecerCuenta, setOfrecerCuenta] = useState(true);
  const [passwordCuenta, setPasswordCuenta] = useState("");
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState("");
  const [cuentaCreada, setCuentaCreada] = useState(false);

  const cargar = useCallback(() => {
    setErrorCarga("");
    return pedir<Pedido>(`/pedidos/${id}`, { auth: true })
      .then(setPedido)
      .catch((e) => setErrorCarga(mensaje(e, "No se pudo cargar tu pedido.")));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Aviso que deja el checkout antes de traer aquí: "compra realizada", motivo de un rechazo…
  useEffect(() => {
    for (const a of tomarAvisosPendientes("ans_aviso_pedido")) avisar(a.tipo, a.texto);
  }, [avisar]);

  const pagar = async () => {
    if (!pedido) return;
    setOcupado("pagar");
    setErrorPago("");
    try {
      const { tokenId, email } = await abrirCulqiCheckout({
        montoCentavos: Math.round(pedido.total * 100),
        email: usuario.email,
        metodoPago: pedido.metodo_pago,
      });
      const actualizado = await pedir<Pedido>(`/pedidos/${pedido.id}/pagar`, {
        method: "POST",
        body: { token_id: tokenId, email, idempotency_key: claveIdempotenciaPago(pedido.id) },
        auth: true,
      });
      setPedido(actualizado);
      if (actualizado.estado_pago === "en_revision") {
        // Culqi no confirmó a tiempo si cobró: el equipo lo revisa. No se debe volver a pagar.
        avisar("success", "Estamos confirmando tu pago con el banco. No vuelvas a pagar.");
      } else {
        limpiarClaveIdempotenciaPago(pedido.id);
        avisar("success", "¡Pago recibido! Gracias por tu compra");
      }
    } catch (err) {
      // Cerrar la ventana de pago no es un error que haya que mostrar en rojo.
      setErrorPago(err instanceof ErrorCulqi && err.code === CULQI_CERRADO ? "" : mensaje(err, "No se pudo procesar el pago"));
    } finally {
      setOcupado("");
    }
  };

  const cancelar = async () => {
    const si = await confirmar({
      titulo: "¿Cancelar este pedido?",
      mensaje: "Esta acción no se puede deshacer.",
      confirmar: "Sí, cancelar pedido",
      cancelar: "No, volver",
      peligro: true,
    });
    if (!si) return;
    setOcupado("cancelar");
    setErrorCancelar("");
    try {
      await pedir(`/pedidos/${id}/cancelar`, { method: "POST", auth: true });
      avisar("success", "Pedido cancelado");
      await cargar();
    } catch (err) {
      setErrorCancelar(mensaje(err, "No se pudo cancelar el pedido"));
    } finally {
      setOcupado("");
    }
  };

  const boleta = async () => {
    if (!pedido) return;
    setOcupado("boleta");
    setErrorBoleta("");
    try {
      await descargarArchivo(`/pedidos/${pedido.id}/boleta`, `boleta-${pedido.numero_pedido}.pdf`);
    } catch (err) {
      setErrorBoleta(mensaje(err, "No se pudo generar el PDF"));
    } finally {
      setOcupado("");
    }
  };

  const crearPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCuenta("");
    setCreandoCuenta(true);
    try {
      setUsuario(await pedir("/auth/completar-cuenta", { method: "POST", body: { password: passwordCuenta }, auth: true }));
      setCuentaCreada(true);
    } catch (err) {
      setErrorCuenta(mensaje(err, "No se pudo guardar la contraseña"));
    } finally {
      setCreandoCuenta(false);
    }
  };

  const copiarNumero = async () => {
    if (!pedido) return;
    try {
      await navigator.clipboard.writeText(pedido.numero_pedido);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sin portapapeles: el número ya está visible para copiarlo a mano
    }
  };

  if (!pedido && errorCarga) {
    const ayuda = enlaceWhatsApp(`Hola, no puedo ver el detalle de mi pedido (referencia ${id}). ¿Me pueden ayudar?`);
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div role="alert" className="flex flex-col items-start gap-3 border-t border-plum pt-6">
          <h1 className="font-display text-3xl text-plum">No pudimos cargar tu pedido</h1>
          <p className="max-w-md text-sm text-plum-soft">{errorCarga}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="button" onClick={cargar} className="btn btn-primary px-6!">Reintentar</button>
            {ayuda && (
              <a href={ayuda} target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-6!">Escríbenos por WhatsApp</a>
            )}
            <Link href="/perfil/pedidos" className="btn btn-secondary px-6!">Ver mis pedidos</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) return <CargandoPedido />;

  const sePuedeCancelar = !TERMINADOS.includes(pedido.estado) && pedido.estado_pago !== "verificado";
  const pagoYaVerificado = pedido.estado_pago === "verificado" && !TERMINADOS.includes(pedido.estado);
  const puedePagar = METODOS_PASARELA.has(pedido.metodo_pago) && pedido.estado !== "cancelado" && pedido.estado_pago === "pendiente";
  const linkWhatsApp = enlaceWhatsApp(`Hola, tengo una consulta sobre mi pedido #${pedido.numero_pedido}`);
  const botonContorno =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-plum/20 text-sm font-semibold text-plum transition-colors hover:border-plum disabled:opacity-60";
  // El título acompaña lo que pasó: no se agradece una compra cancelada o sin pagar.
  const titulo =
    pedido.estado === "cancelado" ? "Pedido cancelado" : puedePagar ? "Tu pedido está registrado" : "¡Gracias por tu compra!";
  const etiquetaSeccion = "border-b border-plum pb-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-plum";

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8">
      <header>
        <span className="aviso-fino">{pedido.estado_label}</span>
        <h1 className="mt-3 font-display text-4xl text-plum">{titulo}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm text-plum-soft">
          <span>
            Pedido <b className="font-semibold text-plum">{pedido.numero_pedido}</b> · Pago con {pedido.metodo_pago_label}
          </span>
          <button
            type="button"
            onClick={copiarNumero}
            aria-label="Copiar número de pedido"
            className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-plum transition-colors hover:bg-plum/5"
          >
            {copiado ? <><IconoCheck size={12} /> Copiado</> : <IconoCopiar size={13} />}
          </button>
        </p>
      </header>

      {usuario.es_invitado && ofrecerCuenta && (
        <div className="relative mt-6 rounded-2xl border border-plum/15 p-5">
          <button
            type="button"
            onClick={() => setOfrecerCuenta(false)}
            aria-label="Cerrar"
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-plum-soft transition hover:text-plum"
          >
            ✕
          </button>
          {cuentaCreada ? (
            <p className="pr-8 text-sm text-plum">
              Listo, ya puedes ingresar con <span className="font-semibold">{usuario.email}</span> y tu nueva contraseña cuando quieras.
            </p>
          ) : (
            <form onSubmit={crearPassword} className="compacto pr-8">
              <p className="font-display text-xl text-plum">Guarda tu cuenta para la próxima</p>
              <p className="mt-1 text-sm text-plum-soft">
                Ponle una contraseña a <span className="font-medium text-plum">{usuario.email}</span> y podrás ver este y tus próximos
                pedidos sin volver a llenar tus datos. Es opcional.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label htmlFor="pwd-cuenta" className="sr-only">Nueva contraseña</label>
                <input
                  id="pwd-cuenta"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nueva contraseña"
                  minLength={6}
                  required
                  value={passwordCuenta}
                  onChange={(e) => setPasswordCuenta(e.target.value)}
                  className="campo-texto flex-1"
                />
                <button type="submit" disabled={creandoCuenta} className="btn-primary min-h-[42px]! shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-50">
                  {creandoCuenta ? <><Girando />Guardando...</> : "Guardar"}
                </button>
              </div>
              {errorCuenta && <p className="mt-2 text-sm text-berry-dark" role="alert">{errorCuenta}</p>}
            </form>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-12">
        <div className="space-y-8">
          <section aria-label="Seguimiento">
            <Seguimiento pedido={pedido} />
          </section>

          {pedido.estado === "listo_recojo" && pedido.codigo_recojo && (
            <section className="rounded-2xl border-2 border-plum p-6 text-center">
              <p className="font-display text-2xl text-plum">¡Tu pedido está listo para recoger!</p>
              <p className="mt-1 text-sm text-plum-soft">Dile este código al personal de la tienda. No lo compartas con nadie más.</p>
              <p
                className="mt-4 font-cifra text-5xl font-semibold tracking-[0.3em] text-plum"
                aria-label={`Código de recojo: ${pedido.codigo_recojo.split("").join(" ")}`}
              >
                {pedido.codigo_recojo}
              </p>
              <p className="mt-4 text-xs text-plum-soft">
                Lleva también tu documento de identidad ({pedido.envio_tipo_documento?.toUpperCase()}).
              </p>
            </section>
          )}

          {pedido.estado_pago !== "no_aplica" && (
            <section aria-labelledby="pedido-pago">
              <h2 id="pedido-pago" className={etiquetaSeccion}>Pago</h2>
              <div className="flex items-center justify-between gap-4 border-b border-plum/10 py-3.5">
                <span className="text-sm text-plum-soft">Estado del pago</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_PAGO[pedido.estado_pago] ?? ""}`}>{pedido.estado_pago_label}</span>
              </div>

              {puedePagar && (
                <div className="mt-4">
                  <button type="button" onClick={pagar} disabled={ocupado !== ""} className="btn-primary min-h-12! w-full disabled:opacity-60">
                    {ocupado === "pagar" ? <><Girando />Conectando con la pasarela...</> : `Pagar con ${pedido.metodo_pago_label}`}
                  </button>
                  {errorPago && <p className="mt-2 text-sm text-berry-dark" role="alert">{errorPago}</p>}
                </div>
              )}
              {pedido.estado_pago === "en_revision" && (
                <p className="mt-3 text-sm text-plum-soft">Tu pago está en revisión. Te avisaremos apenas se confirme.</p>
              )}
              {(pedido.estado_pago === "reembolso_pendiente" || pedido.estado_pago === "reembolsando") && (
                <p className="mt-3 text-sm text-plum-soft">
                  Como ya habías pagado, te vamos a devolver tu dinero. Nos pondremos en contacto contigo para coordinarlo.
                </p>
              )}
              {pedido.estado_pago === "reembolsado" && <p className="mt-3 text-sm text-plum-soft">Tu reembolso ya fue procesado.</p>}
            </section>
          )}

          {pedido.tipo_entrega && (
            <section aria-labelledby="pedido-entrega">
              <h2 id="pedido-entrega" className={etiquetaSeccion}>Datos de entrega</h2>
              <dl className="text-sm">
                <div className="flex justify-between gap-4 border-b border-plum/10 py-3">
                  <dt className="text-plum-soft">Entrega</dt>
                  <dd className="text-right font-semibold text-plum">{pedido.tipo_entrega === "delivery" ? "Delivery" : "Recojo en tienda"}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-plum/10 py-3">
                  <dt className="text-plum-soft">Recibe</dt>
                  <dd className="text-right text-plum">{pedido.envio_nombre} · {pedido.envio_telefono}</dd>
                </div>
                {pedido.envio_direccion && (
                  <div className="flex justify-between gap-4 border-b border-plum/10 py-3">
                    <dt className="text-plum-soft">Dirección</dt>
                    <dd className="text-right text-plum">
                      {pedido.envio_direccion}, {pedido.envio_distrito}
                      {pedido.envio_provincia && `, ${pedido.envio_provincia}`}
                    </dd>
                  </div>
                )}
              </dl>
              {pedido.entrega_estimada_label && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-plum">
                  <IconoReloj size={15} />
                  Llega en {pedido.entrega_estimada_label}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-3 md:sticky md:top-24 md:self-start">
          {/* Resumen en boleta, con el borde perforado de la tienda. */}
          <div className="boleta">
            <h2 className="font-display text-2xl text-plum">Resumen</h2>
            <div className="mt-3">
              {pedido.detalles.map((d) => (
                <div key={d.id} className="linea text-sm">
                  <span>{d.cantidad}× {d.producto_nombre}</span>
                  <span>{soles(d.subtotal)}</span>
                </div>
              ))}
              <div className="linea text-sm text-plum-soft">
                <span>Subtotal</span>
                <span>{soles(pedido.subtotal)}</span>
              </div>
              <div className="linea text-sm text-plum-soft">
                <span>Envío</span>
                <span>{pedido.costo_envio > 0 ? soles(pedido.costo_envio) : "Gratis"}</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-lg font-extrabold uppercase">Total</span>
              <span className="cifra text-2xl font-semibold">{soles(pedido.total)}</span>
            </div>
          </div>

          {pedido.estado_pago === "verificado" && (
            <div>
              <button type="button" onClick={boleta} disabled={ocupado !== ""} className={botonContorno}>
                {ocupado === "boleta" ? <><Girando />Generando boleta...</> : "Descargar boleta"}
              </button>
              {errorBoleta && <p className="mt-2 text-center text-sm text-berry-dark" role="alert">{errorBoleta}</p>}
            </div>
          )}

          <Link href="/tienda" className="btn-primary min-h-12! w-full">
            Seguir comprando
          </Link>

          {linkWhatsApp && (
            <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className={botonContorno}>
              <IconoWhatsApp size={18} />
              ¿Dudas con tu pedido? Escríbenos
            </a>
          )}

          {sePuedeCancelar && (
            <div className="pt-1 text-center">
              <button type="button" onClick={cancelar} disabled={ocupado !== ""} className="min-h-10 text-sm font-semibold text-plum-soft underline underline-offset-4 hover:text-peligro disabled:opacity-60">
                {ocupado === "cancelar" ? <><Girando />Cancelando...</> : "Cancelar pedido"}
              </button>
              {errorCancelar && <p className="mt-2 text-sm text-berry-dark" role="alert">{errorCancelar}</p>}
            </div>
          )}

          {pagoYaVerificado && (
            <p className="pt-1 text-center text-xs text-plum-soft">
              Este pedido ya fue pagado, así que no se puede cancelar desde acá. Si necesitas cancelarlo, escríbenos y gestionamos tu reembolso.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export function CargandoPedido() {
  return (
    <div role="status" aria-label="Cargando pedido" className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div className="skeleton h-6 w-28 rounded-full" aria-hidden="true" />
      <div className="skeleton h-10 w-72 rounded-lg" aria-hidden="true" />
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]" aria-hidden="true">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}
