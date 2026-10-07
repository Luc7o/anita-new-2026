import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconBook } from "../components/Icons.jsx";
import { soloTexto, soloNumeros, soloDni, soloCarnetExtranjeria } from "../validacion.js";

const claseInput =
  "w-full rounded-md border border-plum/20 bg-white px-3 py-2.5 text-plum placeholder:text-plum-soft/50 focus:outline-none focus:border-berry";
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

function descargarPdfBase64(base64, nombreArchivo) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = window.URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}

function Seccion({ titulo, children }) {
  return (
    <fieldset className="rounded-xl border border-plum/15 bg-white/50 p-4 sm:p-5">
      <legend className="px-2 text-sm font-bold uppercase tracking-wide text-berry">{titulo}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function OpcionRadio({ name, valor, actual, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-plum">
      <input
        type="radio"
        name={name}
        value={valor}
        checked={actual === valor}
        onChange={() => onChange(valor)}
        className="mt-1 accent-berry"
      />
      <span>{children}</span>
    </label>
  );
}

export default function LibroReclamaciones() {
  const { usuario } = useAuth();
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    api.reclamacionesInfo().then(setInfo).catch(() => setInfo(null));
  }, []);

  // Si ya inició sesión, se adelanta el correo (puede cambiarlo).
  useEffect(() => {
    if (usuario?.email) {
      setForm((f) => (f.consumidor_email ? f : { ...f, consumidor_email: usuario.email }));
    }
  }, [usuario]);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const fijar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const payload = { ...form };
      if (payload.monto_reclamado === "") delete payload.monto_reclamado;
      const data = await api.enviarReclamo(payload);
      setResultado(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "No se pudo registrar el reclamo. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    return (
      <PaginaInfo
        titulo="Libro de Reclamaciones"
        contenido={
          <div className="space-y-5" role="status">
            <div className="rounded-xl border border-berry/30 bg-berry/5 p-5">
              <p className="text-lg font-semibold text-plum">Registramos tu {form.tipo}</p>
              <p className="mt-1 text-sm">
                Número de hoja de reclamación:{" "}
                <span className="font-bold text-berry">{resultado.codigo}</span>
              </p>
              <p className="mt-2 text-sm">
                Te responderemos como máximo el{" "}
                <strong>
                  {new Date(`${resultado.fecha_limite}T00:00:00`).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </strong>{" "}
                (15 días hábiles), al correo <strong>{form.consumidor_email}</strong>.
              </p>
              {resultado.email_enviado ? (
                <p className="mt-2 text-sm">También te enviamos una copia de tu hoja a ese correo.</p>
              ) : (
                <p className="mt-2 text-sm">
                  No pudimos enviarte el correo con la copia, por eso descárgala ahora y guárdala.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {resultado.pdf_base64 && (
                <button
                  type="button"
                  onClick={() => descargarPdfBase64(resultado.pdf_base64, `hoja-reclamacion-${resultado.codigo}.pdf`)}
                  className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:opacity-90"
                >
                  Descargar mi hoja de reclamación (PDF)
                </button>
              )}
              <Link to="/" className="rounded-full border border-plum/20 px-6 py-2.5 text-sm font-semibold text-plum transition hover:bg-white/60">
                Volver al inicio
              </Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <PaginaInfo
      titulo="Libro de Reclamaciones"
      contenido={
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-berry/25 bg-berry/5 p-4">
            <IconBook size={28} className="mt-0.5 shrink-0 text-berry" />
            <div className="text-sm">
              <p className="font-semibold text-plum">Libro de Reclamaciones virtual</p>
              <p>
                Aquí puedes registrar un reclamo o una queja sobre nuestros productos o nuestra atención. Recibirás
                una copia de tu hoja y te responderemos en un plazo máximo de 15 días hábiles.
              </p>
            </div>
          </div>

          {info && (info.razon_social || info.ruc) && (
            <dl className="grid gap-x-6 gap-y-1 rounded-xl border border-plum/15 bg-white/50 p-4 text-sm sm:grid-cols-2">
              {info.razon_social && (
                <div><dt className="inline font-semibold text-plum">Proveedor: </dt><dd className="inline">{info.razon_social}</dd></div>
              )}
              {info.ruc && (
                <div><dt className="inline font-semibold text-plum">RUC: </dt><dd className="inline">{info.ruc}</dd></div>
              )}
              {info.domicilio && (
                <div className="sm:col-span-2"><dt className="inline font-semibold text-plum">Domicilio: </dt><dd className="inline">{info.domicilio}</dd></div>
              )}
            </dl>
          )}

          <form onSubmit={enviar} className="space-y-5" noValidate={false}>
            <Seccion titulo="1. Identificación del consumidor reclamante">
              <div>
                <label htmlFor="rc-nombre" className={claseLabel}>Nombre completo</label>
                <input id="rc-nombre" required maxLength={150} className={claseInput}
                  value={form.consumidor_nombre} onChange={(e) => fijar("consumidor_nombre", soloTexto(e.target.value))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                <div>
                  <label htmlFor="rc-doc-tipo" className={claseLabel}>Documento</label>
                  <select id="rc-doc-tipo" className={claseInput} value={form.consumidor_doc_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, consumidor_doc_tipo: e.target.value, consumidor_documento: "" }))}>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rc-documento" className={claseLabel}>N° de documento</label>
                  <input id="rc-documento" required inputMode={form.consumidor_doc_tipo === "DNI" ? "numeric" : "text"}
                    className={claseInput} value={form.consumidor_documento}
                    onChange={(e) => fijar("consumidor_documento",
                      form.consumidor_doc_tipo === "DNI" ? soloDni(e.target.value) : soloCarnetExtranjeria(e.target.value))} />
                </div>
              </div>
              <div>
                <label htmlFor="rc-domicilio" className={claseLabel}>Domicilio</label>
                <input id="rc-domicilio" required maxLength={250} className={claseInput}
                  value={form.consumidor_domicilio} onChange={cambiar("consumidor_domicilio")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rc-telefono" className={claseLabel}>Teléfono</label>
                  <input id="rc-telefono" required inputMode="numeric" className={claseInput}
                    value={form.consumidor_telefono} onChange={(e) => fijar("consumidor_telefono", soloNumeros(e.target.value, 12))} />
                </div>
                <div>
                  <label htmlFor="rc-email" className={claseLabel}>Correo electrónico</label>
                  <input id="rc-email" type="email" required maxLength={150} className={claseInput}
                    value={form.consumidor_email} onChange={cambiar("consumidor_email")} />
                </div>
              </div>
              <div>
                <label htmlFor="rc-apoderado" className={claseLabel}>
                  Si eres menor de edad, nombre de tu padre, madre o apoderado <span className="font-normal text-plum-soft">(opcional)</span>
                </label>
                <input id="rc-apoderado" maxLength={150} className={claseInput}
                  value={form.apoderado_nombre} onChange={(e) => fijar("apoderado_nombre", soloTexto(e.target.value))} />
              </div>
            </Seccion>

            <Seccion titulo="2. Identificación del bien contratado">
              <div className="flex flex-wrap gap-6" role="radiogroup" aria-label="Tipo de bien contratado">
                <OpcionRadio name="rc-bien" valor="producto" actual={form.bien_tipo} onChange={(v) => fijar("bien_tipo", v)}>Producto</OpcionRadio>
                <OpcionRadio name="rc-bien" valor="servicio" actual={form.bien_tipo} onChange={(v) => fijar("bien_tipo", v)}>Servicio</OpcionRadio>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rc-monto" className={claseLabel}>Monto reclamado (S/) <span className="font-normal text-plum-soft">(opcional)</span></label>
                  <input id="rc-monto" type="number" min="0" step="0.01" className={claseInput}
                    value={form.monto_reclamado} onChange={cambiar("monto_reclamado")} />
                </div>
                <div>
                  <label htmlFor="rc-pedido-num" className={claseLabel}>N° de pedido <span className="font-normal text-plum-soft">(opcional)</span></label>
                  <input id="rc-pedido-num" maxLength={40} className={claseInput}
                    value={form.numero_pedido} onChange={cambiar("numero_pedido")} />
                </div>
              </div>
              <div>
                <label htmlFor="rc-descripcion" className={claseLabel}>Descripción del producto o servicio</label>
                <input id="rc-descripcion" required maxLength={400} className={claseInput}
                  value={form.bien_descripcion} onChange={cambiar("bien_descripcion")} />
              </div>
            </Seccion>

            <Seccion titulo="3. Detalle de la reclamación y pedido del consumidor">
              <div className="space-y-2" role="radiogroup" aria-label="Tipo de reclamación">
                <OpcionRadio name="rc-tipo" valor="reclamo" actual={form.tipo} onChange={(v) => fijar("tipo", v)}>
                  <strong>Reclamo:</strong> disconformidad relacionada a los productos o servicios.
                </OpcionRadio>
                <OpcionRadio name="rc-tipo" valor="queja" actual={form.tipo} onChange={(v) => fijar("tipo", v)}>
                  <strong>Queja:</strong> disconformidad no relacionada a los productos o servicios, o malestar
                  respecto a la atención al público.
                </OpcionRadio>
              </div>
              <div>
                <label htmlFor="rc-detalle" className={claseLabel}>Detalle</label>
                <textarea id="rc-detalle" required rows={5} minLength={10} maxLength={3000} className={claseInput}
                  value={form.detalle} onChange={cambiar("detalle")} />
              </div>
              <div>
                <label htmlFor="rc-pedido" className={claseLabel}>Pedido (¿qué solución esperas?)</label>
                <textarea id="rc-pedido" required rows={3} minLength={5} maxLength={2000} className={claseInput}
                  value={form.pedido_consumidor} onChange={cambiar("pedido_consumidor")} />
              </div>
            </Seccion>

            {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
              <label>
                No llenes este campo
                <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off"
                  value={form.sitio_web} onChange={cambiar("sitio_web")} />
              </label>
            </div>

            <p className="text-xs">
              * La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito
              previo para interponer una denuncia ante el INDECOPI.
              <br />
              * El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el
              cual es improrrogable.
            </p>

            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={enviando}
              className="w-full rounded-full bg-berry px-6 py-3 text-sm font-semibold text-white shadow-glass transition hover:opacity-90 disabled:opacity-60 sm:w-auto">
              {enviando ? "Enviando..." : "Enviar hoja de reclamación"}
            </button>
          </form>
        </div>
      }
    />
  );
}
