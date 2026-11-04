import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { rutaAdmin } from "../../lib/appMode.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { PUEDE_ANULAR_COMPRAS } from "../../roles.js";
import { soles } from "../../formato.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import Spinner from "../../components/Spinner.jsx";
import { SkeletonDetalleAdmin } from "../../components/admin/EsqueletosAdmin.jsx";
import { IconArrowLeft } from "../../components/Icons.jsx";
import { fechaCorta, ETIQUETA_DOCUMENTO, InsigniaEstadoCompra } from "./AdminCompras.jsx";

const fechaHora = (iso) => {
  if (!iso) return "—";
  // El servidor guarda la hora en UTC sin zona: se le agrega para mostrarla en la hora local.
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
};

export default function AdminCompraDetalle() {
  const { id } = useParams();
  const toast = useToast();
  const { usuario } = useAuth();
  const puedeAnular = PUEDE_ANULAR_COMPRAS.includes(usuario?.rol);

  const [compra, setCompra] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorAnular, setErrorAnular] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.adminCompra(id).then(setCompra).catch((err) => setErrorCarga(err.message || "No se encontró la compra."));
  }, [id]);

  const cerrar = () => {
    if (!enviando) setAnulando(false);
  };
  const refDialogo = useFocusTrap(anulando, cerrar);

  const abrirAnular = () => {
    setMotivo("");
    setErrorAnular("");
    setAnulando(true);
  };

  const anular = async (e) => {
    e.preventDefault();
    setErrorAnular("");
    setEnviando(true);
    try {
      const actualizada = await api.adminAnularCompra(id, motivo.trim());
      setCompra(actualizada);
      setAnulando(false);
      toast.success("Compra anulada. El stock volvió a lo que había antes.");
    } catch (err) {
      setErrorAnular(err.message || "No se pudo anular la compra.");
    } finally {
      setEnviando(false);
    }
  };

  if (errorCarga) {
    return (
      <div>
        <Link to={rutaAdmin("/compras")} className="mb-3 inline-flex items-center gap-1 text-sm text-berry hover:underline">
          <IconArrowLeft size={14} /> Volver a compras
        </Link>
        <p role="alert" className="glass rounded-2xl p-6 text-plum-soft">{errorCarga}</p>
      </div>
    );
  }
  if (!compra) return <SkeletonDetalleAdmin />;

  return (
    <div className="pb-8">
      <Link to={rutaAdmin("/compras")} className="mb-3 inline-flex items-center gap-1 text-sm text-berry hover:underline">
        <IconArrowLeft size={14} /> Volver a compras
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-plum">Compra {compra.numero}</h1>
            <InsigniaEstadoCompra estado={compra.estado} />
          </div>
          <p className="text-sm text-plum-soft">
            {compra.proveedor_nombre} · {fechaCorta(compra.fecha_compra)}
          </p>
        </div>
        {puedeAnular && compra.estado === "recibida" && (
          <button onClick={abrirAnular} className="rounded-[10px] px-4 py-2 text-sm font-semibold text-berry ring-1 ring-berry/40 transition hover:bg-berry/10">
            Anular compra
          </button>
        )}
      </div>

      <section className="glass mb-5 grid gap-4 rounded-2xl p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-plum-soft">Documento</p>
          <p className="font-medium text-plum">
            {compra.numero_documento ? `${ETIQUETA_DOCUMENTO[compra.tipo_documento] || "Doc."} ${compra.numero_documento}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-plum-soft">Registrada por</p>
          <p className="font-medium text-plum">{compra.registrada_por || "—"}</p>
          <p className="text-xs text-plum-soft">{fechaHora(compra.fecha_creacion)}</p>
        </div>
        <div>
          <p className="text-xs text-plum-soft">Unidades</p>
          <p className="font-medium text-plum">{compra.unidades}</p>
        </div>
        <div>
          <p className="text-xs text-plum-soft">Total</p>
          <p className="text-lg font-semibold text-plum">{soles(compra.total)}</p>
        </div>
        {compra.notas && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-plum-soft">Notas</p>
            <p className="whitespace-pre-line text-plum">{compra.notas}</p>
          </div>
        )}
      </section>

      {compra.estado === "anulada" && (
        <section className="mb-5 rounded-2xl bg-plum/5 p-5 text-sm ring-1 ring-plum/10">
          <p className="font-semibold text-plum">Compra anulada</p>
          <p className="text-plum-soft">
            {compra.anulada_por || "—"} · {fechaHora(compra.fecha_anulacion)}
          </p>
          <p className="mt-1 text-plum">Motivo: {compra.motivo_anulacion}</p>
        </section>
      )}

      <div className="glass hidden overflow-hidden rounded-2xl md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-plum-soft">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Talla / color</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Costo unit.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {compra.items.map((it) => (
              <tr key={it.id} className="border-t border-white/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-plum">{it.producto_nombre}</p>
                  <p className="text-xs text-plum-soft">{it.sku}</p>
                </td>
                <td className="px-4 py-3 text-plum-soft">{[it.talla, it.color].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-3 text-right text-plum">{it.cantidad}</td>
                <td className="px-4 py-3 text-right text-plum-soft">{soles(it.costo_unitario)}</td>
                <td className="px-4 py-3 text-right font-medium text-plum">{soles(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {compra.items.map((it) => (
          <div key={it.id} className="glass rounded-2xl p-4">
            <p className="font-medium text-plum">{it.producto_nombre}</p>
            <p className="text-xs text-plum-soft">{[it.talla, it.color, it.sku].filter(Boolean).join(" · ")}</p>
            <p className="mt-1 text-sm text-plum">
              {it.cantidad} × {soles(it.costo_unitario)} = <span className="font-semibold">{soles(it.subtotal)}</span>
            </p>
          </div>
        ))}
      </div>

      {anulando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 animate-fade-in bg-plum/30 backdrop-blur-sm" onClick={cerrar} aria-label="Cerrar" />
          <form
            ref={refDialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="anular-titulo"
            tabIndex={-1}
            onSubmit={anular}
            className="animate-scale-in glass-strong relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 shadow-glass-lg sm:p-8"
          >
            <h2 id="anular-titulo" className="mb-2 text-xl font-semibold text-plum">¿Anular la compra {compra.numero}?</h2>
            <p className="mb-4 text-sm text-plum-soft">
              Se descontará del stock todo lo que ingresó con esta compra. Si ya se vendió parte de esa mercadería, no se podrá anular.
            </p>
            <label htmlFor="anular-motivo" className="mb-1 block text-xs font-medium text-plum-soft">Motivo de la anulación</label>
            <textarea
              id="anular-motivo"
              required
              minLength={3}
              maxLength={200}
              rows={3}
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry"
            />
            {errorAnular && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorAnular}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={cerrar} className="px-4 py-2 text-sm text-plum-soft hover:text-berry">Volver</button>
              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center rounded-[10px] bg-berry px-5 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
              >
                {enviando && <Spinner />}
                Anular compra
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
