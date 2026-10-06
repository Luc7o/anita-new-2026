import React, { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Dialog from "../../components/Dialog.jsx";
import { IconClose } from "../../components/Icons.jsx";
import { PUEDE_GESTIONAR_RECLAMACIONES } from "../../roles.js";

const FILTROS = [
  { valor: "pendiente", label: "Pendientes" },
  { valor: "respondido", label: "Respondidos" },
  { valor: "", label: "Todos" },
];

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString("es-PE") : "-";
}

// Días corridos que faltan para la fecha límite (el plazo legal es de 15 días
// hábiles; la fecha límite ya viene calculada por el backend).
function diasParaLimite(fechaLimite) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(`${fechaLimite}T00:00:00`);
  return Math.round((limite - hoy) / 86400000);
}

function InsigniaPlazo({ reclamo }) {
  if (reclamo.estado === "respondido") {
    return <span className="rounded-full bg-berry/10 px-2.5 py-1 text-xs font-semibold text-berry-dark">Respondido</span>;
  }
  const dias = diasParaLimite(reclamo.fecha_limite);
  if (dias < 0) {
    return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Vencido hace {-dias} d</span>;
  }
  if (dias <= 3) {
    return <span className="rounded-full bg-gold/30 px-2.5 py-1 text-xs font-semibold text-plum">{dias === 0 ? "Vence hoy" : `Vence en ${dias} d`}</span>;
  }
  return <span className="rounded-full bg-plum/10 px-2.5 py-1 text-xs font-semibold text-plum-soft">{dias} días</span>;
}

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-plum-soft">{etiqueta}</dt>
      <dd className="whitespace-pre-line text-sm text-plum">{children || "-"}</dd>
    </div>
  );
}

function DetalleReclamo({ reclamo, puedeResponder, onCerrar, onRespondido }) {
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const responder = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const actualizado = await api.adminResponderReclamo(reclamo.id, respuesta.trim());
      setAviso(
        actualizado.email_enviado
          ? "Respuesta registrada y enviada al consumidor."
          : "Respuesta registrada, pero no se pudo enviar el correo. Descarga la hoja y envíasela."
      );
      onRespondido(actualizado);
    } catch (err) {
      setError(err.message || "No se pudo registrar la respuesta");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog labelledBy="reclamo-titulo" onClose={onCerrar}
      className="max-h-[90vh] w-[min(94vw,720px)] overflow-y-auto rounded-3xl bg-white p-5 shadow-glass sm:p-7">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="reclamo-titulo" className="text-xl font-semibold text-plum">
            {reclamo.tipo === "queja" ? "Queja" : "Reclamo"} N° {reclamo.codigo}
          </h2>
          <p className="text-sm text-plum-soft">
            Registrado el {fechaCorta(reclamo.fecha_registro)} · Fecha límite de respuesta: {fechaCorta(reclamo.fecha_limite)}
          </p>
        </div>
        <button type="button" onClick={onCerrar} aria-label="Cerrar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-plum transition hover:bg-plum/10">
          <IconClose size={18} />
        </button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Dato etiqueta="Consumidor">{reclamo.consumidor_nombre}</Dato>
        <Dato etiqueta={reclamo.consumidor_doc_tipo}>{reclamo.consumidor_documento}</Dato>
        <Dato etiqueta="Correo">{reclamo.consumidor_email}</Dato>
        <Dato etiqueta="Teléfono">{reclamo.consumidor_telefono}</Dato>
        <div className="sm:col-span-2"><Dato etiqueta="Domicilio">{reclamo.consumidor_domicilio}</Dato></div>
        {reclamo.apoderado_nombre && (
          <div className="sm:col-span-2"><Dato etiqueta="Padre, madre o apoderado">{reclamo.apoderado_nombre}</Dato></div>
        )}
        <Dato etiqueta="Bien contratado">{reclamo.bien_tipo === "servicio" ? "Servicio" : "Producto"}</Dato>
        <Dato etiqueta="Monto reclamado">
          {reclamo.monto_reclamado != null ? `S/ ${reclamo.monto_reclamado.toFixed(2)}` : ""}
        </Dato>
        <div className="sm:col-span-2">
          <Dato etiqueta="Descripción">
            {reclamo.bien_descripcion}
            {reclamo.numero_pedido ? `\nPedido: ${reclamo.numero_pedido}` : ""}
          </Dato>
        </div>
        <div className="sm:col-span-2"><Dato etiqueta="Detalle">{reclamo.detalle}</Dato></div>
        <div className="sm:col-span-2"><Dato etiqueta="Pedido del consumidor">{reclamo.pedido_consumidor}</Dato></div>
      </dl>

      {reclamo.estado === "respondido" && (
        <div className="mt-4 rounded-xl border border-berry/25 bg-berry/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum-soft">
            Respuesta enviada el {fechaCorta(reclamo.fecha_respuesta)}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-plum">{reclamo.respuesta}</p>
        </div>
      )}

      {reclamo.estado === "pendiente" && puedeResponder && (
        <form onSubmit={responder} className="mt-5 space-y-3">
          <label htmlFor="reclamo-respuesta" className="block text-sm font-semibold text-plum">
            Respuesta al consumidor (se envía por correo con su hoja en PDF)
          </label>
          <textarea id="reclamo-respuesta" required rows={5} minLength={10} maxLength={3000}
            value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
            className="w-full rounded-md border border-plum/20 bg-white px-3 py-2.5 text-plum focus:border-berry focus:outline-none" />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={enviando}
            className="rounded-full bg-berry px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition hover:opacity-90 disabled:opacity-60">
            {enviando ? "Enviando..." : "Registrar y enviar respuesta"}
          </button>
        </form>
      )}
      {aviso && <p role="status" className="mt-3 text-sm font-medium text-berry-dark">{aviso}</p>}

      <div className="mt-5 border-t border-plum/10 pt-4">
        <button type="button" onClick={() => api.adminHojaReclamoPdf(reclamo.id, reclamo.codigo)}
          className="text-sm font-semibold text-berry hover:underline">
          Descargar hoja de reclamación (PDF)
        </button>
      </div>
    </Dialog>
  );
}

export default function AdminReclamaciones() {
  const { usuario } = useAuth();
  const puedeResponder = PUEDE_GESTIONAR_RECLAMACIONES.includes(usuario?.rol);
  const [reclamos, setReclamos] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    setCargando(true);
    api
      .adminReclamaciones(filtro ? { estado: filtro } : {})
      .then((data) => setReclamos(data.reclamaciones))
      .finally(() => setCargando(false));
  }, [filtro]);

  const alResponder = (actualizado) => {
    setSeleccionado(actualizado);
    setReclamos((lista) =>
      filtro === "pendiente"
        ? lista.filter((r) => r.id !== actualizado.id)
        : lista.map((r) => (r.id === actualizado.id ? actualizado : r))
    );
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-plum">Libro de Reclamaciones</h1>
      <p className="mb-6 text-sm text-plum-soft">
        Cada reclamo o queja debe responderse en un máximo de 15 días hábiles.
      </p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button key={f.label} onClick={() => setFiltro(f.valor)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium shadow-glass ${
              filtro === f.valor ? "bg-berry text-white" : "glass text-plum"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-plum-soft">Cargando reclamaciones...</p>
      ) : reclamos.length === 0 ? (
        <p className="glass rounded-3xl p-6 text-center text-plum-soft shadow-glass">No hay reclamaciones con ese filtro.</p>
      ) : (
        <>
          <div className="glass hidden overflow-hidden rounded-3xl shadow-glass md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/50 text-xs uppercase tracking-wide text-plum-soft">
                <tr>
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">Consumidor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Registrado</th>
                  <th className="px-4 py-3">Límite</th>
                  <th className="px-4 py-3">Plazo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {reclamos.map((r) => (
                  <tr key={r.id} className="border-t border-white/40">
                    <td className="px-4 py-3 font-medium text-plum">{r.codigo}</td>
                    <td className="px-4 py-3 text-plum-soft">{r.consumidor_nombre}</td>
                    <td className="px-4 py-3 capitalize text-plum-soft">{r.tipo}</td>
                    <td className="px-4 py-3 text-plum-soft">{fechaCorta(r.fecha_registro)}</td>
                    <td className="px-4 py-3 text-plum-soft">{fechaCorta(r.fecha_limite)}</td>
                    <td className="px-4 py-3"><InsigniaPlazo reclamo={r} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSeleccionado(r)} className="text-berry hover:underline">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {reclamos.map((r) => (
              <button key={r.id} onClick={() => setSeleccionado(r)}
                className="glass block w-full rounded-2xl p-4 text-left shadow-glass">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-plum">{r.codigo}</p>
                    <p className="text-sm text-plum-soft">{r.consumidor_nombre}</p>
                  </div>
                  <InsigniaPlazo reclamo={r} />
                </div>
                <p className="mt-2 text-xs capitalize text-plum-soft">
                  {r.tipo} · límite {fechaCorta(r.fecha_limite)}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {seleccionado && (
        <DetalleReclamo
          key={seleccionado.id}
          reclamo={seleccionado}
          puedeResponder={puedeResponder}
          onCerrar={() => setSeleccionado(null)}
          onRespondido={alResponder}
        />
      )}
    </div>
  );
}
