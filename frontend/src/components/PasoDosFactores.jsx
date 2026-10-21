import React, { useState } from "react";
import Spinner from "./Spinner.jsx";
import { IconArrowLeft } from "./Icons.jsx";

// Pantalla del segundo paso del ingreso: código de 6 dígitos de la app de
// autenticación, o un código de respaldo. Se usa en el ingreso de la tienda y
// en el del panel (`estilo="panel"` ajusta los colores al fondo oscuro).
export default function PasoDosFactores({ onVerificar, onCancelar, estilo = "tienda" }) {
  const [codigo, setCodigo] = useState("");
  const [usarRespaldo, setUsarRespaldo] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await onVerificar(codigo.trim());
    } catch (err) {
      setError(err.message || "No se pudo verificar el código.");
      // Pasaron los 5 minutos: no tiene sentido seguir intentando, hay que volver a empezar.
      if (err.data?.code === "pase_expirado") onCancelar?.();
    } finally {
      setEnviando(false);
    }
  };

  const claseBoton = estilo === "panel" ? "bg-berry hover:bg-berry-dark" : "bg-plum hover:bg-berry-dark";

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className={estilo === "panel" ? "" : "text-center"}>
        <h2 className={`font-semibold text-plum ${estilo === "panel" ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
          Verificación en dos pasos
        </h2>
        <p className="mt-2 text-sm text-plum-soft">
          {usarRespaldo
            ? "Escribe uno de tus códigos de respaldo. Cada uno sirve una sola vez."
            : "Abre tu app de autenticación y escribe el código de 6 dígitos de Anita New Style."}
        </p>
      </div>

      <div>
        <label htmlFor="codigo-2fa" className="mb-1.5 block text-sm font-semibold text-plum">
          {usarRespaldo ? "Código de respaldo" : "Código de 6 dígitos"}
        </label>
        <input
          id="codigo-2fa"
          autoFocus
          autoComplete="one-time-code"
          inputMode={usarRespaldo ? "text" : "numeric"}
          maxLength={usarRespaldo ? 12 : 7}
          value={codigo}
          onChange={(e) =>
            setCodigo(usarRespaldo ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") : e.target.value.replace(/[^\d ]/g, ""))
          }
          placeholder={usarRespaldo ? "xxxxx-xxxxx" : "000000"}
          className="w-full rounded-md border border-plum/20 bg-white px-4 py-3 text-center text-xl tracking-[0.3em] text-plum placeholder:tracking-normal placeholder:text-plum-soft/40 focus:border-berry focus:outline-none"
        />
      </div>

      {error && <p role="alert" className="text-sm text-berry-dark">{error}</p>}

      <button
        type="submit"
        disabled={enviando || codigo.replace(/\s/g, "").length < (usarRespaldo ? 10 : 6)}
        className={`w-full rounded-lg py-3.5 font-semibold text-white transition disabled:opacity-60 ${claseBoton}`}
      >
        {enviando ? <><Spinner />Verificando...</> : "Verificar e ingresar"}
      </button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => { setUsarRespaldo((v) => !v); setCodigo(""); setError(""); }}
          className="font-semibold text-berry hover:underline"
        >
          {usarRespaldo ? "Usar el código de mi app" : "No tengo mi celular: usar un código de respaldo"}
        </button>
        <button type="button" onClick={onCancelar} className="inline-flex items-center gap-1.5 text-plum-soft hover:text-berry">
          <IconArrowLeft size={14} /> Volver
        </button>
      </div>
    </form>
  );
}
