"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { guardarComoArchivo, pedir, recuperarSesion } from "@/lib/api";
import { soloDni, soloNumeros, soloTexto } from "@/lib/validacion";
import { Girando } from "@/componentes/acceso/Girando";

// Hoja de reclamación (como frontend/src/pages/LibroReclamaciones.jsx). La envía
// POST /api/reclamaciones, que devuelve el código, la fecha límite y la hoja en PDF.

const claseInput =
  "w-full rounded-md border border-plum/20 bg-white px-3 py-2.5 text-plum placeholder:text-plum-soft/50 focus:outline-hidden focus:border-berry";
const claseLabel = "mb-1.5 block text-sm font-semibold text-plum";

const FORM_INICIAL = {
  consumidor_nombre: "",
  consumidor_doc_tipo: "DNI",
  consumidor_documento: "",
  consumidor_domicilio: "",
  consumidor_telefono: "",
  consumidor_email: "",
  apoderado_nombre: "",
  bien_tipo: "producto",
  monto_reclamado: "",
  numero_pedido: "",
  bien_descripcion: "",
  tipo: "reclamo",
  detalle: "",
  pedido_consumidor: "",
  sitio_web: "", // campo trampa anti-bots: las personas nunca lo ven ni lo llenan
};
type Campo = keyof typeof FORM_INICIAL;
type Resultado = { codigo: string; fecha_limite: string; email_enviado: boolean; pdf_base64?: string | null };

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-plum/15 bg-white/50 p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold uppercase tracking-wide text-berry">{titulo}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Opcion({ name, valor, actual, onChange, children }: { name: string; valor: string; actual: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-plum">
      <input type="radio" name={name} value={valor} checked={actual === valor} onChange={() => onChange(valor)} className="mt-1 accent-berry" />
      <span>{children}</span>
    </label>
  );
}

export function FormReclamo() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Con sesión iniciada se adelanta el correo (puede cambiarlo). Solo si hay señal de sesión.
  useEffect(() => {
    let vigente = true;
    let senal = /(?:^|; )csrf_refresh_token=/.test(document.cookie);
    try {
      senal ||= Boolean(localStorage.getItem("ans_csrf_refresh"));
    } catch {
      // sin localStorage
    }
    if (!senal) return;
    (async () => {
      if (!(await recuperarSesion())) return;
      const u = await pedir<{ email: string }>("/auth/perfil", { auth: true }).catch(() => null);
      if (vigente && u?.email) setForm((f) => (f.consumidor_email ? f : { ...f, consumidor_email: u.email }));
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const fijar = (campo: Campo, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));
  const cambiar = (campo: Campo) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => fijar(campo, e.target.value);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const { monto_reclamado, ...resto } = form;
      const datos = await pedir<Resultado>("/reclamaciones", {
        method: "POST",
        body: monto_reclamado === "" ? resto : { ...resto, monto_reclamado },
      });
      setResultado(datos);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el reclamo. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const descargarPdf = () => {
    if (!resultado?.pdf_base64) return;
    const bytes = Uint8Array.from(atob(resultado.pdf_base64), (c) => c.charCodeAt(0));
    guardarComoArchivo(`hoja-reclamacion-${resultado.codigo}.pdf`, new Blob([bytes], { type: "application/pdf" }));
  };

  if (resultado) {
    return (
      <div className="space-y-5" role="status">
        <div className="rounded-xl border border-berry/30 bg-berry/5 p-5">
          <p className="text-lg font-semibold text-plum">Registramos tu {form.tipo}</p>
          <p className="mt-1 text-sm">
            Número de hoja de reclamación: <span className="font-bold text-berry">{resultado.codigo}</span>
          </p>
          <p className="mt-2 text-sm">
            Te responderemos como máximo el{" "}
            <strong>
              {new Date(`${resultado.fecha_limite}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
            </strong>{" "}
            (15 días hábiles), al correo <strong>{form.consumidor_email}</strong>.
          </p>
          <p className="mt-2 text-sm">
            {resultado.email_enviado
              ? "También te enviamos una copia de tu hoja a ese correo."
              : "No pudimos enviarte el correo con la copia, por eso descárgala ahora y guárdala."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {resultado.pdf_base64 && (
            <button
              type="button"
              onClick={descargarPdf}
              className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:opacity-90"
            >
              Descargar mi hoja de reclamación (PDF)
            </button>
          )}
          <Link href="/" className="rounded-full border border-plum/20 px-6 py-2.5 text-sm font-semibold text-plum transition hover:bg-white/60">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <Seccion titulo="1. Identificación del consumidor reclamante">
        <div>
          <label htmlFor="rc-nombre" className={claseLabel}>Nombre completo</label>
          <input id="rc-nombre" required maxLength={150} autoComplete="name" className={claseInput} value={form.consumidor_nombre} onChange={(e) => fijar("consumidor_nombre", soloTexto(e.target.value))} />
        </div>
        <div>
          <label htmlFor="rc-documento" className={claseLabel}>N° de DNI</label>
          <input id="rc-documento" required inputMode="numeric" className={claseInput} value={form.consumidor_documento} onChange={(e) => fijar("consumidor_documento", soloDni(e.target.value))} />
        </div>
        <div>
          <label htmlFor="rc-domicilio" className={claseLabel}>Domicilio</label>
          <input id="rc-domicilio" required maxLength={250} autoComplete="street-address" className={claseInput} value={form.consumidor_domicilio} onChange={cambiar("consumidor_domicilio")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rc-telefono" className={claseLabel}>Teléfono</label>
            <input id="rc-telefono" required inputMode="numeric" autoComplete="tel" className={claseInput} value={form.consumidor_telefono} onChange={(e) => fijar("consumidor_telefono", soloNumeros(e.target.value, 12))} />
          </div>
          <div>
            <label htmlFor="rc-email" className={claseLabel}>Correo electrónico</label>
            <input id="rc-email" type="email" required maxLength={150} autoComplete="email" className={claseInput} value={form.consumidor_email} onChange={cambiar("consumidor_email")} />
          </div>
        </div>
        <div>
          <label htmlFor="rc-apoderado" className={claseLabel}>
            Si eres menor de edad, nombre de tu padre, madre o apoderado <span className="font-normal text-plum-soft">(opcional)</span>
          </label>
          <input id="rc-apoderado" maxLength={150} className={claseInput} value={form.apoderado_nombre} onChange={(e) => fijar("apoderado_nombre", soloTexto(e.target.value))} />
        </div>
      </Seccion>

      <Seccion titulo="2. Identificación del bien contratado">
        <div className="flex flex-wrap gap-6" role="radiogroup" aria-label="Tipo de bien contratado">
          <Opcion name="rc-bien" valor="producto" actual={form.bien_tipo} onChange={(v) => fijar("bien_tipo", v)}>Producto</Opcion>
          <Opcion name="rc-bien" valor="servicio" actual={form.bien_tipo} onChange={(v) => fijar("bien_tipo", v)}>Servicio</Opcion>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rc-monto" className={claseLabel}>
              Monto reclamado (S/) <span className="font-normal text-plum-soft">(opcional)</span>
            </label>
            <input id="rc-monto" type="number" min="0" step="0.01" className={claseInput} value={form.monto_reclamado} onChange={cambiar("monto_reclamado")} />
          </div>
          <div>
            <label htmlFor="rc-pedido-num" className={claseLabel}>
              N° de pedido <span className="font-normal text-plum-soft">(opcional)</span>
            </label>
            <input id="rc-pedido-num" maxLength={40} className={claseInput} value={form.numero_pedido} onChange={cambiar("numero_pedido")} />
          </div>
        </div>
        <div>
          <label htmlFor="rc-descripcion" className={claseLabel}>Descripción del producto o servicio</label>
          <input id="rc-descripcion" required maxLength={400} className={claseInput} value={form.bien_descripcion} onChange={cambiar("bien_descripcion")} />
        </div>
      </Seccion>

      <Seccion titulo="3. Detalle de la reclamación y pedido del consumidor">
        <div className="space-y-2" role="radiogroup" aria-label="Tipo de reclamación">
          <Opcion name="rc-tipo" valor="reclamo" actual={form.tipo} onChange={(v) => fijar("tipo", v)}>
            <strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios.
          </Opcion>
          <Opcion name="rc-tipo" valor="queja" actual={form.tipo} onChange={(v) => fijar("tipo", v)}>
            <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar respecto a la atención al público.
          </Opcion>
        </div>
        <div>
          <label htmlFor="rc-detalle" className={claseLabel}>Detalle</label>
          <textarea id="rc-detalle" required rows={5} minLength={10} maxLength={3000} className={claseInput} value={form.detalle} onChange={cambiar("detalle")} />
        </div>
        <div>
          <label htmlFor="rc-pedido" className={claseLabel}>Pedido (¿qué solución esperas?)</label>
          <textarea id="rc-pedido" required rows={3} minLength={5} maxLength={2000} className={claseInput} value={form.pedido_consumidor} onChange={cambiar("pedido_consumidor")} />
        </div>
      </Seccion>

      {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
        <label>
          No llenes este campo
          <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" value={form.sitio_web} onChange={cambiar("sitio_web")} />
        </label>
      </div>

      <p className="text-xs">
        * La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una
        denuncia ante el INDECOPI.
        <br />* El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.
      </p>

      {error && (
        <p role="alert" className="rounded-lg border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-berry px-6 py-3 text-sm font-semibold text-white shadow-glass transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {enviando ? <><Girando />Enviando...</> : "Enviar hoja de reclamación"}
      </button>
    </form>
  );
}
