"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { IconoAtras, IconoCandado, IconoCheck } from "@/componentes/Iconos";
import { CasillasCodigo } from "./CasillasCodigo";
import { Girando } from "./Girando";

// Segundo paso del ingreso: código de 6 dígitos de la app de autenticación (en casillas, se
// envía solo al completar la última) o un código de respaldo. Si el código es válido se
// muestra un check mientras se abre la cuenta; si no, las casillas tiemblan y se vacían.
export function PasoDosFactores({ onVerificar, onCancelar }: {
  onVerificar: (codigo: string, recordarDispositivo: boolean) => Promise<void>;
  onCancelar: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [usarRespaldo, setUsarRespaldo] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);
  const [intentos, setIntentos] = useState(0); // al fallar, las casillas se rehacen y el foco vuelve a la primera
  const formulario = useRef<HTMLFormElement>(null);

  const completo = codigo.replace(/\s/g, "").length >= (usarRespaldo ? 10 : 6);

  // Con la app, al llenar la sexta casilla se envía sin tener que tocar el botón.
  useEffect(() => {
    if (!usarRespaldo && codigo.length === 6 && !enviando && !error) formulario.current?.requestSubmit();
  }, [codigo, usarRespaldo, enviando, error]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completo || enviando) return;
    setError("");
    setEnviando(true);
    try {
      await onVerificar(codigo.trim(), recordarDispositivo);
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código.");
      // Pasaron los 5 minutos del pase: hay que volver a empezar.
      if (err instanceof ErrorApi && (err.data as { code?: string } | null)?.code === "pase_expirado") onCancelar();
      setEnviando(false);
      if (!usarRespaldo) {
        setCodigo("");
        setIntentos((n) => n + 1);
      }
    }
  };

  if (exito) {
    return (
      <div role="status" className="py-10 text-center">
        <span className="exito-aparece mx-auto grid h-20 w-20 place-items-center rounded-full bg-plum text-ivory">
          <IconoCheck size={36} />
        </span>
        <h2 className="mt-6 font-display text-3xl text-plum">Código verificado</h2>
        <p className="mt-2 text-sm text-plum-soft">Entrando a tu cuenta…</p>
      </div>
    );
  }

  return (
    <form ref={formulario} onSubmit={enviar} className="space-y-6" noValidate>
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-plum/15 text-plum">
          <IconoCandado size={22} />
        </span>
        <h2 className="mt-5 font-display text-3xl text-plum sm:text-4xl">Verificación en dos pasos</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-plum-soft">
          {usarRespaldo
            ? "Escribe uno de tus códigos de respaldo. Cada uno sirve una sola vez."
            : "Abre tu app de autenticación y escribe el código de 6 dígitos de Anita New Style."}
        </p>
      </div>

      {usarRespaldo ? (
        <div>
          <label htmlFor="codigo-2fa" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Código de respaldo
          </label>
          <input
            id="codigo-2fa"
            autoFocus
            autoComplete="off"
            maxLength={12}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="xxxxx-xxxxx"
            className="campo-linea pl-1! text-center font-cifra text-xl! tracking-[0.2em] placeholder:tracking-normal"
          />
        </div>
      ) : (
        <div>
          <p id="codigo-2fa-etiqueta" className="sr-only">Código de 6 dígitos</p>
          <CasillasCodigo
            key={intentos}
            valor={codigo}
            onCambiar={(v) => {
              setCodigo(v);
              if (error) setError("");
            }}
            error={Boolean(error)}
            etiquetaId="codigo-2fa-etiqueta"
            autoFocus
            deshabilitado={enviando}
          />
        </div>
      )}

      {error && <p role="alert" className="text-center text-sm text-peligro">{error}</p>}

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-plum-soft">
        <input
          type="checkbox"
          checked={recordarDispositivo}
          onChange={(e) => setRecordarDispositivo(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-berry"
        />
        <span>
          Confiar en este dispositivo por 30 días
          <span className="block text-xs">No te pediremos el código aquí. Úsalo solo en tu propio equipo.</span>
        </span>
      </label>

      <button type="submit" disabled={enviando || !completo} className="btn-pildora w-full">
        {enviando ? <><Girando />Verificando...</> : "Verificar e ingresar"}
      </button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => { setUsarRespaldo((v) => !v); setCodigo(""); setError(""); }}
          className="font-semibold text-berry hover:underline"
        >
          {usarRespaldo ? "Usar el código de mi app" : "No tengo mi celular: usar un código de respaldo"}
        </button>
        <button type="button" onClick={onCancelar} className="inline-flex min-h-11 items-center gap-1.5 text-plum-soft hover:text-plum">
          <IconoAtras size={14} /> Volver
        </button>
      </div>
    </form>
  );
}
