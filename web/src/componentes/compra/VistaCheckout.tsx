"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ErrorApi, pedir, registrarEvento } from "@/lib/api";
import { abrirCulqiCheckout, claveIdempotenciaPago, CULQI_CERRADO, ErrorCulqi, limpiarClaveIdempotenciaPago } from "@/lib/culqi";
import { soles } from "@/lib/precio";
import { COSTO_DELIVERY, MARCAS_TARJETA } from "@/lib/tienda";
import { soloDireccion, soloDni, soloNumeros, soloRuc, soloTexto } from "@/lib/validacion";
import { IconoCarrito } from "../Iconos";
import { useCompra, type Usuario } from "./Compra";
import { UbicacionEntrega } from "./UbicacionEntrega";

// Port fiel de frontend/src/pages/Checkout.jsx: cualquier regla de negocio nueva va en
// las dos versiones mientras convivan.

const METODOS = [
  { id: "yape", label: "Yape" },
  { id: "tarjeta", label: "Tarjeta" },
] as const;

const DOCUMENTOS = {
  dni: { label: "DNI", min: 8, max: 8, filtro: soloDni, placeholder: "Número de DNI (8 dígitos)", pattern: "[0-9]{8}", ayuda: "El DNI debe tener 8 dígitos" },
  ruc: { label: "RUC", min: 11, max: 11, filtro: soloRuc, placeholder: "Número de RUC (11 dígitos)", pattern: "[0-9]{11}", ayuda: "El RUC debe tener 11 dígitos" },
} as const;
type TipoDoc = keyof typeof DOCUMENTOS;

type DatosDoc = { nombres?: string; apellido_paterno?: string; apellido_materno?: string; nombre_o_razon_social?: string; estado?: string; condicion?: string };
type EstadoDoc =
  | { estado: "idle" | "invalido" | "no_verificado" }
  | { estado: "validando"; mensaje: string }
  | { estado: "valido"; datos: DatosDoc };

type Pedido = { id: number; total: number; estado_pago: string; metodo_pago: string };
type ItemSinStock = { item_id: number | string; mensaje: string };

const esProvisional = (u: Usuario | null) =>
  Boolean(u?.es_invitado && /^Cliente [0-9A-F]{4}$/.test(u?.nombre || ""));

const CLAVE_IDEMPOTENCIA = "ans_checkout_idempotency_key";

/** Deja el aviso para que el detalle del pedido lo muestre tras la recarga completa. */
function dejarAviso(avisos: { tipo: "success" | "error" | "info"; texto: string }[]) {
  try {
    sessionStorage.setItem("ans_aviso_pedido", JSON.stringify(avisos));
  } catch {
    // sin sessionStorage el pedido igual muestra su estado
  }
}

export function VistaCheckout() {
  const { listo, items, total, totalItems, usuario, refrescar, quitar, vaciarLocal, continuarComoInvitado } = useCompra();
  const provisional = esProvisional(usuario);

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    razon_social: "",
    envio_tipo_documento: "dni" as TipoDoc,
    envio_numero_documento: "",
    envio_telefono: "",
    envio_email: "",
    envio_direccion: "",
    envio_distrito: "",
    envio_provincia: "",
    envio_dpto: "",
    distrito_id: null as number | null,
    envio_referencia: "",
    tipo_entrega: "delivery" as "delivery" | "recojo",
    metodo_pago: "yape" as "yape" | "tarjeta",
    nota: "",
  });
  const set = <K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) => setForm((f) => ({ ...f, [campo]: valor }));

  // Al conocerse la sesión se precargan nombre y correo (salvo un nombre provisional "Cliente 3FA9").
  const precargado = useRef(false);
  useEffect(() => {
    if (!listo || precargado.current) return;
    precargado.current = true;
    if (usuario) {
      setForm((f) => ({
        ...f,
        nombres: provisional ? "" : usuario.nombre || "",
        apellidos: provisional ? "" : usuario.apellido || "",
        envio_email: usuario.email || "",
      }));
    }
  }, [listo, usuario, provisional]);

  const [cuentaExistente, setCuentaExistente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [doc, setDoc] = useState<EstadoDoc>({ estado: "idle" });
  const cacheDocs = useRef(new Map<string, EstadoDoc>());
  const [sinStock, setSinStock] = useState<ItemSinStock[]>([]);
  const [quitando, setQuitando] = useState<number | string | null>(null);
  const [resumenAbierto, setResumenAbierto] = useState(false);

  // Una clave por intento de compra: reintentos (doble clic, red, recarga) devuelven el
  // mismo pedido en vez de crear otro. Se limpia cuando el pedido se crea.
  const [claveIdempotencia] = useState(() => {
    try {
      const existente = sessionStorage.getItem(CLAVE_IDEMPOTENCIA);
      if (existente) return existente;
      const nueva = crypto.randomUUID();
      sessionStorage.setItem(CLAVE_IDEMPOTENCIA, nueva);
      return nueva;
    } catch {
      return crypto.randomUUID();
    }
  });

  const tipoDoc = form.envio_tipo_documento;
  const numeroDoc = form.envio_numero_documento;
  const docConfig = DOCUMENTOS[tipoDoc];
  const nombreBloqueado = doc.estado === "valido";
  const limpiarNombresSiValido = () => (doc.estado === "valido" ? { nombres: "", apellidos: "", razon_social: "" } : {});

  // Apenas el número está completo se consulta (RENIEC/SUNAT) y se autocompleta el nombre.
  useEffect(() => {
    if (numeroDoc.length < DOCUMENTOS[tipoDoc].min) {
      setDoc({ estado: "idle" });
      return;
    }
    let cancelado = false;
    const clave = `${tipoDoc}:${numeroDoc}`;
    const aplicar = (r: EstadoDoc) => {
      if (cancelado) return;
      setDoc(r);
      if (r.estado !== "valido") return;
      const d = r.datos;
      if (tipoDoc === "ruc") setForm((f) => ({ ...f, razon_social: d.nombre_o_razon_social || f.razon_social }));
      else
        setForm((f) => ({
          ...f,
          nombres: d.nombres || f.nombres,
          apellidos: [d.apellido_paterno, d.apellido_materno].filter(Boolean).join(" ") || f.apellidos,
        }));
    };
    const guardado = cacheDocs.current.get(clave);
    if (guardado) {
      aplicar(guardado);
      return () => {
        cancelado = true;
      };
    }
    setDoc({ estado: "validando", mensaje: `Validando ${DOCUMENTOS[tipoDoc].label}...` });
    pedir<DatosDoc>(`/documentos/consultar?tipo=${tipoDoc}&numero=${numeroDoc}`)
      .then((datos): EstadoDoc => ({ estado: "valido", datos }))
      // 404 = el documento no existe. Otro error (red, servicio caído) no acusa al cliente.
      .catch((e): EstadoDoc => (e instanceof ErrorApi && e.status === 404 ? { estado: "invalido" } : { estado: "no_verificado" }))
      .then((r) => {
        if (r.estado !== "no_verificado") cacheDocs.current.set(clave, r);
        aplicar(r);
      });
    return () => {
      cancelado = true;
    };
  }, [tipoDoc, numeroDoc]);

  const avisoDoc = (() => {
    switch (doc.estado) {
      case "validando":
        return { texto: doc.mensaje, clase: "text-plum-soft" };
      case "valido": {
        const d = doc.datos;
        const detalle =
          tipoDoc === "ruc"
            ? [d.nombre_o_razon_social, [d.estado, d.condicion].filter(Boolean).join(" · ")].filter(Boolean).join(" — ")
            : [d.nombres, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(" ");
        return { texto: `✓ ${docConfig.label} válido${detalle ? `: ${detalle}` : ""}`, clase: "text-exito" };
      }
      case "invalido":
        return { texto: `✗ ${docConfig.label} no válido: no encontramos ese número. Revísalo.`, clase: "text-berry-dark" };
      case "no_verificado":
        return { texto: `No pudimos verificar tu ${docConfig.label} en este momento. Puedes continuar escribiendo tus datos manualmente.`, clase: "text-plum-soft" };
      default:
        return null;
    }
  })();

  // "Inicio de checkout" (KPI): al entrar con algo en el carrito.
  const inicioRegistrado = useRef(false);
  useEffect(() => {
    if (listo && items.length > 0 && !inicioRegistrado.current) {
      inicioRegistrado.current = true;
      registrarEvento("inicio_checkout", { items: items.length, total });
    }
  }, [listo, items.length, total]);

  const costoEnvio = form.tipo_entrega === "delivery" ? COSTO_DELIVERY : 0;

  async function quitarSinStock(itemId: number | string) {
    setQuitando(itemId);
    try {
      await quitar(itemId);
      setSinStock((s) => s.filter((p) => p.item_id !== itemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo quitar");
    } finally {
      setQuitando(null);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSinStock([]);
    if (doc.estado === "validando") return setError("Estamos validando tu documento, espera un momento e inténtalo de nuevo.");
    if (doc.estado === "invalido") return setError(`El ${docConfig.label} ingresado no es válido. Corrígelo para continuar.`);
    if (!usuario && !aceptaTerminos) return setError("Marca la casilla de Términos y Política de Privacidad para continuar con tu compra.");

    setEnviando(true);
    let navegando = false;
    try {
      // 0) Sin sesión: se crea la cuenta solo con el correo y el carrito del navegador pasa a ella.
      let usuarioActual = usuario;
      let cuentaNueva = false;
      if (!usuarioActual) {
        setCuentaExistente(false);
        try {
          usuarioActual = await continuarComoInvitado(form.envio_email.trim());
          cuentaNueva = true;
        } catch (err) {
          if (err instanceof ErrorApi && err.status === 409) setCuentaExistente(true);
          setError(err instanceof Error ? err.message : "No pudimos continuar");
          return;
        }
        const antes = totalItems;
        const fusionado = await refrescar();
        if (fusionado.total_items !== antes) {
          // Algo se agotó entre que armó el carrito y pagó: que lo vea antes de cobrarle.
          setError(
            fusionado.ajustes?.length
              ? `Ajustamos tu carrito por falta de stock: ${fusionado.ajustes.map((a) => a.mensaje).join(" ")} Revisa el resumen y confirma de nuevo.`
              : "Ajustamos tu carrito por falta de stock. Revisa el resumen y confirma de nuevo."
          );
          return;
        }
      }

      // 1) Se crea el pedido (reserva stock) con estado_pago "pendiente".
      const { nombres, apellidos, razon_social, ...datosEnvio } = form;
      const envio_nombre = tipoDoc === "ruc" ? razon_social.trim() : `${nombres.trim()} ${apellidos.trim()}`.trim();
      const pedido = await pedir<Pedido>("/pedidos/checkout", {
        method: "POST",
        body: { ...datosEnvio, envio_nombre, idempotency_key: claveIdempotencia },
        auth: true,
      });
      try {
        sessionStorage.removeItem(CLAVE_IDEMPOTENCIA);
      } catch {
        // no-op
      }
      if ((cuentaNueva || provisional) && tipoDoc !== "ruc") {
        // La cuenta tenía nombre provisional: se guardan los datos reales en el perfil.
        await pedir("/auth/perfil", {
          method: "PUT",
          body: { nombre: nombres.trim(), apellido: apellidos.trim(), telefono: form.envio_telefono },
          auth: true,
        }).catch(() => undefined);
      }
      vaciarLocal();
      registrarEvento("compra_completada", { pedido_id: pedido.id, total: pedido.total, metodo_pago: pedido.metodo_pago });

      // 2) Pago por pasarela: se abre Culqi aquí mismo y el token va al backend para cobrar.
      let pagado = pedido.estado_pago !== "pendiente";
      let enRevision = false;
      let motivoRechazo = "";
      if (pedido.estado_pago === "pendiente") {
        try {
          const { tokenId, email } = await abrirCulqiCheckout({
            montoCentavos: Math.round(pedido.total * 100),
            email: form.envio_email.trim() || usuarioActual?.email || null,
            metodoPago: pedido.metodo_pago,
          });
          const resultado = await pedir<{ estado_pago?: string }>(`/pedidos/${pedido.id}/pagar`, {
            method: "POST",
            body: { token_id: tokenId, email, idempotency_key: claveIdempotenciaPago(pedido.id) },
            auth: true,
          });
          // "en_revision": Culqi no confirmó a tiempo; el cliente NO debe volver a pagar.
          enRevision = resultado?.estado_pago === "en_revision";
          if (!enRevision) limpiarClaveIdempotenciaPago(pedido.id);
          pagado = !enRevision;
        } catch (errPago) {
          // Cerró la ventana o Culqi rechazó: el pedido ya existe y se reintenta desde su detalle
          // (sin limpiar la clave: si el cobro sí se hizo, el backend no vuelve a cobrar).
          if (!(errPago instanceof ErrorCulqi && errPago.code === CULQI_CERRADO) && errPago instanceof Error) motivoRechazo = errPago.message;
        }
      }

      dejarAviso([
        ...(motivoRechazo ? [{ tipo: "error" as const, texto: motivoRechazo }] : []),
        {
          tipo: "success",
          texto: enRevision
            ? "Estamos confirmando tu pago con el banco. Te avisaremos por correo; no vuelvas a pagar."
            : pagado
              ? "¡Compra realizada! Gracias por tu pedido"
              : "¡Pedido registrado! Completa el pago para confirmarlo",
        },
      ]);
      // El detalle del pedido todavía vive en la tienda actual (SPA): recarga completa.
      navegando = true;
      window.location.assign(`/pedidos/${pedido.id}`);
    } catch (err) {
      // 409 con items_sin_stock: se muestra junto a cada producto afectado.
      const datos = err instanceof ErrorApi ? (err.data as { items_sin_stock?: ItemSinStock[] } | null) : null;
      if (err instanceof ErrorApi && err.status === 409 && datos?.items_sin_stock?.length) {
        setSinStock(datos.items_sin_stock);
        setError("");
      } else {
        setError(err instanceof Error ? err.message : "Ocurrió un error, intenta de nuevo.");
      }
    } finally {
      if (!navegando) setEnviando(false);
    }
  }

  if (!listo) {
    return (
      <div role="status" aria-label="Cargando" className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1.4fr_1fr]">
        <div className="skeleton h-[640px] rounded-[20px]" aria-hidden="true" />
        <div className="skeleton hidden h-72 rounded-[20px] md:block" aria-hidden="true" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <IconoCarrito size={32} className="mx-auto text-plum-soft" />
        <p className="mt-4 font-display text-2xl font-bold">Tu carrito está vacío</p>
        <p className="mt-2 text-plum-soft">Agrega productos antes de continuar con el pago.</p>
        <Link href="/tienda" className="btn-primary mt-6 inline-flex px-6">Ir a la tienda</Link>
      </div>
    );
  }

  const resumen = (
    <>
      <h2 className="font-display text-2xl font-bold">Resumen</h2>
      {items.map((item) => {
        const problema = sinStock.find((p) => p.item_id === item.id);
        return (
          <div key={item.id}>
            <div className="flex justify-between text-sm text-plum-soft">
              <span>{item.cantidad}× {item.producto.nombre}</span>
              <span className="cifra">{soles(item.subtotal)}</span>
            </div>
            {problema && (
              <div role="alert" className="mt-1 rounded-xl border border-berry/30 bg-berry/5 p-2.5 text-xs text-berry-dark">
                <p className="mb-1.5">{problema.mensaje}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/producto/${item.producto.id}`} className="min-h-9 rounded-full border border-plum/15 bg-white px-3 py-1 font-semibold text-plum">Elegir otra opción</Link>
                  <button type="button" onClick={() => quitarSinStock(item.id)} disabled={quitando === item.id} className="min-h-9 rounded-full border border-plum/15 bg-white px-3 py-1 font-semibold text-plum disabled:opacity-50">
                    {quitando === item.id ? "Quitando..." : "Quitar del carrito"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-dashed border-plum/30 pt-3 text-sm text-plum-soft">
        <div className="flex justify-between"><span>Subtotal</span><span className="cifra">{soles(total)}</span></div>
        <div className="flex justify-between"><span>Envío</span><span className="cifra">{costoEnvio > 0 ? soles(costoEnvio) : "Gratis"}</span></div>
      </div>
      <div className="flex items-baseline justify-between border-t border-dashed border-plum/30 pt-3">
        <span className="text-lg font-extrabold uppercase">Total</span>
        <span className="cifra text-2xl font-semibold">{soles(total + costoEnvio)}</span>
      </div>
    </>
  );

  const opcion = (activa: boolean) => `opcion ${activa ? "opcion-on" : ""}`;
  const bloqueado = "cursor-not-allowed bg-ivory text-plum-soft";

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 pb-28 md:grid-cols-[1.4fr_1fr] md:pb-16">
      {enviando && (
        <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 animate-fade-in-up items-center gap-3 rounded-full bg-plum px-5 py-3 text-sm font-semibold text-ivory shadow-pop md:bottom-8">
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
          Procesando tu pedido… no cierres esta ventana
        </div>
      )}

      <form onSubmit={enviar} className="space-y-5 rounded-[20px] bg-white p-6 sm:p-8 dark:bg-white/5">
        {!usuario && (
          <section className="space-y-3 rounded-2xl border border-plum/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Compra sin cuenta</h2>
                <p className="mt-0.5 text-xs text-plum-soft">
                  No necesitas crear una cuenta para comprar. Al correo que escribas abajo te enviaremos la confirmación y un enlace para crear tu contraseña cuando quieras.
                </p>
              </div>
              <a href="/ingresar?volver=/checkout" className="shrink-0 text-xs font-semibold text-berry hover:underline">¿Ya tienes cuenta? Ingresa</a>
            </div>
            <label htmlFor="checkout-acepta-terminos" className="flex cursor-pointer items-start gap-2.5 text-xs text-plum-soft">
              <input
                id="checkout-acepta-terminos"
                type="checkbox"
                required
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-berry"
              />
              <span>
                He leído y acepto los{" "}
                <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">Términos y Condiciones</a>{" "}
                y la{" "}
                <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">Política de Privacidad</a>.
              </span>
            </label>
            {cuentaExistente && <a href="/ingresar?volver=/checkout" className="btn-dark">Iniciar sesión para continuar</a>}
          </section>
        )}

        <h1 className="font-display text-3xl font-bold">Datos de entrega</h1>

        <div role="radiogroup" aria-label="Tipo de entrega" className="grid grid-cols-2 gap-3">
          <button type="button" role="radio" aria-checked={form.tipo_entrega === "delivery"} onClick={() => set("tipo_entrega", "delivery")} className={opcion(form.tipo_entrega === "delivery")}>
            Delivery ({soles(COSTO_DELIVERY)})
          </button>
          <button type="button" role="radio" aria-checked={form.tipo_entrega === "recojo"} onClick={() => set("tipo_entrega", "recojo")} className={opcion(form.tipo_entrega === "recojo")}>
            Recojo en tienda
          </button>
        </div>

        <div>
          <div role="radiogroup" aria-label="Tipo de documento" className="mb-2 flex flex-wrap gap-2">
            {(Object.keys(DOCUMENTOS) as TipoDoc[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tipoDoc === t}
                onClick={() => {
                  setForm((f) => ({ ...f, ...limpiarNombresSiValido(), envio_tipo_documento: t, envio_numero_documento: "" }));
                  setDoc({ estado: "idle" });
                }}
                className={opcion(tipoDoc === t)}
              >
                {DOCUMENTOS[t].label}
              </button>
            ))}
          </div>
          <label htmlFor="chk-documento" className="mb-1 block text-xs font-semibold">Número de {docConfig.label}</label>
          <input
            id="chk-documento"
            placeholder={docConfig.placeholder}
            required
            inputMode="numeric"
            maxLength={docConfig.max}
            pattern={docConfig.pattern}
            title={docConfig.ayuda}
            autoComplete="off"
            value={numeroDoc}
            onChange={(e) => {
              const nuevo = docConfig.filtro(e.target.value);
              if (nuevo !== numeroDoc) setForm((f) => ({ ...f, ...limpiarNombresSiValido(), envio_numero_documento: nuevo }));
            }}
            className="campo-texto"
          />
          {avisoDoc && (
            <p className={`mt-1.5 px-2 text-xs ${avisoDoc.clase}`} role={doc.estado === "invalido" ? "alert" : "status"} aria-live="polite">
              {avisoDoc.texto}
            </p>
          )}
        </div>

        {tipoDoc === "ruc" ? (
          <div>
            <label htmlFor="chk-razon-social" className="mb-1 block text-xs font-semibold">Razón social</label>
            <input id="chk-razon-social" placeholder="Razón social (nombre de la empresa)" required maxLength={160} value={form.razon_social} onChange={(e) => set("razon_social", e.target.value)} readOnly={nombreBloqueado && !!form.razon_social} className={`campo-texto ${nombreBloqueado && form.razon_social ? bloqueado : ""}`} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="chk-nombres" className="mb-1 block text-xs font-semibold">Nombres</label>
              <input id="chk-nombres" placeholder="Nombres" required maxLength={80} value={form.nombres} onChange={(e) => set("nombres", soloTexto(e.target.value))} readOnly={nombreBloqueado && !!form.nombres} className={`campo-texto ${nombreBloqueado && form.nombres ? bloqueado : ""}`} />
            </div>
            <div>
              <label htmlFor="chk-apellidos" className="mb-1 block text-xs font-semibold">Apellidos</label>
              <input id="chk-apellidos" placeholder="Apellidos" required maxLength={80} value={form.apellidos} onChange={(e) => set("apellidos", soloTexto(e.target.value))} readOnly={nombreBloqueado && !!form.apellidos} className={`campo-texto ${nombreBloqueado && form.apellidos ? bloqueado : ""}`} />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="chk-telefono" className="mb-1 block text-xs font-semibold">Teléfono</label>
          <input id="chk-telefono" placeholder="Teléfono (9 dígitos)" required inputMode="numeric" maxLength={9} pattern="9[0-9]{8}" title="El teléfono debe tener 9 dígitos y empezar con 9" value={form.envio_telefono} onChange={(e) => set("envio_telefono", soloNumeros(e.target.value))} className="campo-texto" />
        </div>

        <div>
          <label htmlFor="chk-email" className="mb-1 block text-xs font-semibold">Correo electrónico</label>
          <input
            id="chk-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Correo electrónico"
            required
            maxLength={120}
            value={form.envio_email}
            onChange={(e) => {
              set("envio_email", e.target.value);
              setCuentaExistente(false);
            }}
            className="campo-texto"
          />
        </div>

        {form.tipo_entrega === "delivery" && (
          <>
            <div>
              <label htmlFor="chk-direccion" className="mb-1 block text-xs font-semibold">Dirección</label>
              <input id="chk-direccion" placeholder="Dirección" required maxLength={200} title="Solo letras, números y los símbolos . * ° #" value={form.envio_direccion} onChange={(e) => set("envio_direccion", soloDireccion(e.target.value))} className="campo-texto" />
            </div>
            <UbicacionEntrega onChange={(u) => setForm((f) => ({ ...f, ...u }))} />
            <div>
              <label htmlFor="chk-referencia" className="mb-1 block text-xs font-semibold">Referencia</label>
              <input id="chk-referencia" placeholder="Referencia (ej. frente al parque, casa azul)" required maxLength={200} value={form.envio_referencia} onChange={(e) => set("envio_referencia", e.target.value)} className="campo-texto" />
            </div>
          </>
        )}

        <div>
          <span id="metodo-pago-label" className="mb-2 block text-sm font-medium">Método de pago</span>
          <div role="radiogroup" aria-labelledby="metodo-pago-label" className="flex gap-2">
            {METODOS.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={form.metodo_pago === m.id} onClick={() => set("metodo_pago", m.id)} className={opcion(form.metodo_pago === m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-2xl bg-ivory p-4 text-sm text-plum-soft" aria-live="polite">
            {form.metodo_pago === "yape" ? (
              <p>Al confirmar tu pedido se abrirá una ventana para que ingreses tu número de Yape y el código de aprobación de 6 dígitos que te llega en la app. El pago se verifica al instante.</p>
            ) : (
              <p>Al confirmar tu pedido se abrirá un formulario seguro para pagar con tarjeta {MARCAS_TARJETA.join(" o ")}. Nunca guardamos tu número de tarjeta ni el CVV.</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="chk-nota" className="mb-1 block text-xs font-semibold">Nota para tu pedido (opcional)</label>
          <textarea id="chk-nota" placeholder="Nota para tu pedido (opcional)" maxLength={500} rows={2} value={form.nota} onChange={(e) => set("nota", e.target.value)} className="campo-texto" />
        </div>

        {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

        <button type="submit" disabled={enviando} className="btn-primary min-h-13! w-full text-base! disabled:cursor-not-allowed disabled:opacity-50">
          {enviando ? "Confirmando pedido..." : "Confirmar y pagar"}
        </button>
      </form>

      <aside className="boleta hidden h-fit space-y-3 md:sticky md:top-28 md:block md:self-start">{resumen}</aside>

      {/* Celular: barra fija con el total y el desglose desplegable. */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        {resumenAbierto && (
          <div className="glass-strong max-h-[60vh] space-y-3 overflow-y-auto rounded-t-3xl border-b border-plum/10 p-5 shadow-glass-lg">{resumen}</div>
        )}
        <button
          type="button"
          onClick={() => setResumenAbierto((a) => !a)}
          aria-expanded={resumenAbierto}
          className="glass-strong flex w-full items-center justify-between rounded-t-3xl border-t border-plum/10 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-glass-lg"
        >
          <span className="text-sm font-medium">
            {resumenAbierto ? "Ocultar resumen ▴" : `Ver resumen (${items.length} ${items.length === 1 ? "producto" : "productos"}) ▾`}
          </span>
          <span className="text-lg font-semibold">{soles(total + costoEnvio)}</span>
        </button>
      </div>
    </div>
  );
}
