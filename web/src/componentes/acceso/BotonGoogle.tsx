"use client";

import { useEffect, useRef, useState } from "react";
import { ingresarConGoogle, type ResultadoIngreso } from "@/lib/acceso";

// Botón oficial "Continuar con Google".
// Si falta NEXT_PUBLIC_GOOGLE_CLIENT_ID no se muestra nada.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

type Gsi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};
declare global {
  interface Window {
    google?: Gsi;
  }
}

let promesaScript: Promise<void> | null = null;
function cargarScriptGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!promesaScript) {
    promesaScript = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        promesaScript = null;
        reject(new Error("No se pudo cargar Google"));
      };
      document.head.appendChild(s);
    });
  }
  return promesaScript;
}

export function BotonGoogle({ texto = "continue_with", aceptaTerminos, bloqueado = false, onResultado, onError }: {
  texto?: "signin_with" | "signup_with" | "continue_with";
  /** Solo en registro (donde se muestra la casilla). En el ingreso sirve para cuentas que ya existen. */
  aceptaTerminos?: boolean;
  bloqueado?: boolean;
  onResultado: (r: ResultadoIngreso) => void;
  onError: (mensaje: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [fallo, setFallo] = useState(false);
  const alResultado = useRef(onResultado);
  const alError = useRef(onError);
  const acepta = useRef(aceptaTerminos);
  useEffect(() => {
    alResultado.current = onResultado;
    alError.current = onError;
    acepta.current = aceptaTerminos;
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelado = false;
    cargarScriptGoogle()
      .then(() => {
        if (cancelado || !contenedor.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              alResultado.current(await ingresarConGoogle(credential, acepta.current === true));
            } catch (err) {
              alError.current(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google");
            }
          },
        });
        window.google.accounts.id.renderButton(contenedor.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: texto,
          shape: "pill",
          locale: "es",
          width: Math.min(contenedor.current.offsetWidth || 380, 400),
        });
      })
      .catch(() => {
        if (!cancelado) setFallo(true);
      });
    return () => {
      cancelado = true;
    };
  }, [texto]);

  if (!GOOGLE_CLIENT_ID) return null;
  if (fallo) {
    return (
      <p className="text-center text-xs text-plum-soft">
        No se pudo cargar Google. Revisa tu conexión o desactiva el bloqueador de anuncios.
      </p>
    );
  }
  return (
    <div>
      <div className="relative">
        {/* Sin la casilla marcada, el botón (un iframe de Google) queda tapado e inerte. */}
        <div ref={contenedor} inert={bloqueado || undefined} className={`flex w-full justify-center ${bloqueado ? "opacity-50" : ""}`} />
        {bloqueado && (
          <button
            type="button"
            onClick={() => alError.current("Marca la casilla de Términos y Política de Privacidad para continuar con Google.")}
            className="absolute inset-0 cursor-not-allowed"
            aria-label="Marca primero la casilla de Términos y Política de Privacidad para continuar con Google"
          />
        )}
      </div>
      {aceptaTerminos === undefined && (
        <p className="mt-3 text-center text-xs text-plum-soft">
          Si ya tienes cuenta, entra con Google. Para crear una cuenta nueva,{" "}
          <a href="/registro" className="font-semibold text-berry hover:underline">regístrate aquí</a>{" "}
          y acepta los Términos y la Política de privacidad.
        </p>
      )}
    </div>
  );
}
