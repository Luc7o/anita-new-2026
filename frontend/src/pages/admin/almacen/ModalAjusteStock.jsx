import React, { useState } from "react";
import { api } from "../../../api/client.js";
import { useToast } from "../../../context/ToastContext.jsx";
import { useFocusTrap } from "../../../hooks/useFocusTrap.js";
import Spinner from "../../../components/Spinner.jsx";

const OPCIONES = [
  { id: "merma", etiqueta: "Merma (se dañó o se perdió)", signo: -1, tipo: "merma" },
  { id: "salida", etiqueta: "Ajuste: sacar unidades", signo: -1, tipo: "ajuste_manual" },
  { id: "entrada", etiqueta: "Ajuste: agregar unidades", signo: 1, tipo: "ajuste_manual" },
];

const textoVariante = (v) => [v.talla && `Talla ${v.talla}`, v.color].filter(Boolean).join(" · ");

/** Registra una merma o un ajuste puntual de una variante (o de un producto sin variantes). */
export default function ModalAjusteStock({ producto, variante, onCerrar, onHecho }) {
  const toast = useToast();
  const [opcion, setOpcion] = useState("merma");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    if (!enviando) onCerrar();
  };
  const refDialogo = useFocusTrap(true, cerrar);

  const actual = variante ? variante.stock : producto.stock_total;
  const elegida = OPCIONES.find((o) => o.id === opcion);
  const n = Number(cantidad);
  const valida = Number.isInteger(n) && n >= 1;
  const resultado = valida ? actual + elegida.signo * n : null;

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!valida) return setError("Escribe una cantidad entera mayor a 0.");
    if (resultado < 0) return setError(`No puedes sacar ${n}: solo hay ${actual}.`);
    setEnviando(true);
    try {
      await api.adminAjusteStock({
        tipo: elegida.tipo,
        producto_id: producto.producto_id,
        variante_id: variante ? variante.variante_id : null,
        cambio: elegida.signo * n,
        motivo: motivo.trim(),
      });
      toast.success("Stock actualizado");
      onHecho();
    } catch (err) {
      setError(err.message || "No se pudo registrar el cambio.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 animate-fade-in bg-plum/30 backdrop-blur-sm" onClick={cerrar} aria-label="Cerrar" />
      <form
        ref={refDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajuste-titulo"
        tabIndex={-1}
        onSubmit={guardar}
        className="animate-scale-in glass-strong relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 shadow-glass-lg sm:p-8"
      >
        <h2 id="ajuste-titulo" className="text-xl font-semibold text-plum">Merma o ajuste de stock</h2>
        <p className="mb-4 text-sm text-plum-soft">
          {producto.nombre}
          {variante ? ` · ${textoVariante(variante)}` : ""} — hay <span className="font-semibold text-plum">{actual}</span> en stock
        </p>

        <fieldset className="mb-4 space-y-2">
          <legend className="sr-only">Tipo de cambio</legend>
          {OPCIONES.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm text-plum">
              <input type="radio" name="tipo-ajuste" checked={opcion === o.id} onChange={() => setOpcion(o.id)} />
              {o.etiqueta}
            </label>
          ))}
        </fieldset>

        <div className="mb-4">
          <label htmlFor="ajuste-cantidad" className="mb-1 block text-xs font-medium text-plum-soft">Cantidad de unidades</label>
          <input
            id="ajuste-cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            autoFocus
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-full rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry"
          />
          {resultado !== null && (
            <p className="mt-1 text-xs text-plum-soft" aria-live="polite">
              El stock pasará de {actual} a <span className="font-semibold text-plum">{resultado}</span>.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ajuste-motivo" className="mb-1 block text-xs font-medium text-plum-soft">Motivo (obligatorio)</label>
          <textarea
            id="ajuste-motivo"
            rows={2}
            required
            minLength={3}
            maxLength={200}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: polos manchados en bodega"
            className="w-full rounded-[10px] bg-white px-3 py-2 text-sm text-plum ring-1 ring-plum/20 focus:outline-none focus:ring-2 focus:ring-berry"
          />
        </div>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={cerrar} className="px-4 py-2 text-sm text-plum-soft hover:text-berry">Cancelar</button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center rounded-[10px] bg-berry px-5 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-60"
          >
            {enviando && <Spinner />}
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}
