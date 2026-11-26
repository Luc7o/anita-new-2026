"use client";

import { useState } from "react";
import { destinoTrasIngresar, registrarConCorreo, verificarSegundoPaso, type ResultadoIngreso } from "@/lib/acceso";
import { BotonGoogle, HAY_GOOGLE } from "@/componentes/acceso/BotonGoogle";
import { CasillaTerminos } from "@/componentes/acceso/CasillaTerminos";
import { PasoDosFactores } from "@/componentes/acceso/PasoDosFactores";
import { Girando } from "@/componentes/acceso/Girando";
import { IconoCorreo } from "@/componentes/Iconos";

// Registro mínimo: solo el correo. La cuenta se crea al instante (nombre y contraseña
// aleatorios) con sesión abierta para seguir comprando; los datos reales se piden al
// comprar y le llega un enlace por correo para elegir su contraseña cuando quiera.
export function FormRegistro() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // Empieza SIEMPRE sin marcar: sin aceptar no se crea la cuenta (ni con correo ni con Google).
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [pase2fa, setPase2fa] = useState<string | null>(null);

  const irAlDestino = () => window.location.assign(destinoTrasIngresar());

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!aceptaTerminos) {
      setError("Marca la casilla de Términos y Política de Privacidad para crear tu cuenta.");
      return;
    }
    setEnviando(true);
    try {
      await registrarConCorreo(email.trim());
      irAlDestino();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
      setEnviando(false);
    }
  };

  // Con Google puede ser una cuenta que ya existe y tiene verificación en dos pasos.
  const alGoogle = (r: ResultadoIngreso) => ("pase2fa" in r ? setPase2fa(r.pase2fa) : irAlDestino());

  if (pase2fa) {
    return (
      <PasoDosFactores
        onVerificar={async (codigo, recordarDispositivo) => {
          await verificarSegundoPaso(pase2fa, codigo, recordarDispositivo);
          irAlDestino();
        }}
        onCancelar={() => setPase2fa(null)}
      />
    );
  }

  return (
    <>
      <div className="mb-7 bajo:mb-5">
        <h2 className="font-display text-4xl text-plum bajo:text-[2rem]">Crear cuenta</h2>
        <p className="mt-2 text-sm leading-relaxed text-plum-soft">
          Solo necesitas tu correo. Podrás seguir comprando de inmediato y elegir tu contraseña cuando quieras.
        </p>
      </div>

      <CasillaTerminos id="reg-acepta-terminos" checked={aceptaTerminos} onChange={setAceptaTerminos} className="mb-5" />

      {HAY_GOOGLE && (
        <>
          <BotonGoogle
            texto="signup_with"
            aceptaTerminos={aceptaTerminos}
            bloqueado={!aceptaTerminos}
            onResultado={alGoogle}
            onError={setError}
          />
          <div className="my-6 flex items-center gap-3 bajo:my-4 text-xs font-medium uppercase tracking-wide text-plum-soft">
            <span className="h-px flex-1 bg-plum/10" />
            o con tu correo
            <span className="h-px flex-1 bg-plum/10" />
          </div>
        </>
      )}

      <form onSubmit={enviar} className="space-y-5">
        <div>
          <label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-[0.14em] text-plum-soft">
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="reg-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="maria.anita@gmail.com"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="campo-linea"
            />
            <span className="pointer-events-none absolute inset-y-0 left-0.5 flex items-center text-plum-soft">
              <IconoCorreo size={17} />
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-berry-dark" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={enviando || !aceptaTerminos}
          className="btn-pildora w-full"
        >
          {enviando ? <><Girando />Creando cuenta...</> : "Crear cuenta"}
        </button>
      </form>

    </>
  );
}
