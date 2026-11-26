"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorApi } from "@/lib/api";
import { IconoAtras, IconoCandado } from "@/componentes/Iconos";
import { CasillasCodigo, type FaseCodigo } from "./CasillasCodigo";
import { Girando } from "./Girando";

// Segundo paso del ingreso: código de 6 dígitos de la app de autenticación (en casillas, se
// envía solo al completar la última) o un código de respaldo. Mientras se comprueba, una luz
// recorre el borde de cada casilla; si es correcto, las casillas se juntan en una sola que se
// pone verde con un check y recién ahí se entra a la cuenta (onListo). Si no, tiemblan y se vacían.

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LUZ_MIN_MS = 900; // la luz da al menos una vuelta aunque el servidor responda antes
const JUNTAR_MS = 520;
const CHECK_MS = 1100;

export function PasoDosFactores({ onVerificar, onListo, onCancelar }: {
  /** Comprueba el código; si falla, lanza el error. */
  onVerificar: (codigo: string, recordarDispositivo: boolean) => Promise<unknown>;
  /** Se llama al terminar la animación de éxito (abre la cuenta). */
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [usarRespaldo, setUsarRespaldo] = useState(false);
  const [error, setError] = useState("");
  const [fase, setFase] = useState<FaseCodigo>("escribiendo");
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);
  const [intentos, setIntentos] = useState(0); // al fallar, las casillas se rehacen y el foco vuelve a la primera
  const formulario = useRef<HTMLFormElement>(null);

  const enviando = fase !== "escribiendo";
  const verificado = fase === "juntando" || fase === "listo";
  const completo = codigo.replace(/\s/g, "").length >= (usarRespaldo ? 10 : 6);

  // Con la app, al llenar la sexta casilla se envía sin tener que tocar el botón.
  useEffect(() => {
    if (!usarRespaldo && codigo.length === 6 && !enviando && !error) formulario.current?.requestSubmit();
  }, [codigo, usarRespaldo, enviando, error]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completo || enviando) return;
    setError("");
    (document.activeElement as HTMLElement | null)?.blur();
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFase("verificando");
    try {
      await Promise.all([onVerificar(codigo.trim(), recordarDispositivo), espera(quieto ? 0 : LUZ_MIN_MS)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el código.");
      setFase("escribiendo");
      // Pasaron los 5 minutos del pase: hay que volver a empezar.
      if (err instanceof ErrorApi && (err.data as { code?: string } | null)?.code === "pase_expirado") onCancelar();
      if (!usarRespaldo) {
        setCodigo("");
        setIntentos((n) => n + 1);
      }
      return;
    }
    if (!quieto && !usarRespaldo) {
      setFase("juntando");
      await espera(JUNTAR_MS);
    }
    setFase("listo");
    await espera(quieto ? 400 : CHECK_MS);
    onListo();
  };

  return (
    <form ref={formulario} onSubmit={enviar} className="space-y-6" noValidate>
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-plum/15 text-plum">
          <IconoCandado size={22} />
        </span>
        <h2 className="mt-5 font-display text-3xl text-plum sm:text-4xl">{verificado ? "Código verificado" : "Verificación en dos pasos"}</h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-plum-soft">
          {verificado
            ? "Todo en orden. Entrando a tu cuenta…"
            : usarRespaldo
              ? "Escribe uno de tus códigos de respaldo. Cada uno sirve una sola vez."
              : "Abre tu app de autenticación y escribe el código de 6 dígitos de Anita New Style."}
        </p>
      </div>

      {usarRespaldo && !verificado ? (
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
            // Con código de respaldo no hay casillas que juntar: se pasa directo al check verde.
            fase={usarRespaldo ? "listo" : fase}
          />
        </div>
      )}

      {error && <p role="alert" className="text-center text-sm text-peligro">{error}</p>}

      {/* Al acertar queda solo el título y el check verde: los controles se vuelven invisibles
          pero conservan su lugar, así nada salta mientras las casillas se juntan. */}
      <div className={`space-y-6 transition-opacity duration-300 ${verificado ? "invisible opacity-0" : ""}`} inert={verificado || undefined}>
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
      </div>
    </form>
  );
}
