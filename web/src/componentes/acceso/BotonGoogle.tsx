"use client";

import { useEffect, useRef, useState } from "react";
import { ingresarConGoogle, type ResultadoIngreso } from "@/lib/acceso";

// Botón oficial "Continuar con Google".
// Si falta NEXT_PUBLIC_GOOGLE_CLIENT_ID no se muestra nada.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
// Entorno de diseño local (npm run diseno): no hay ID de Google y Google no acepta localhost,
// así que se dibuja una muestra quieta del botón para poder diseñar alrededor de él.
const MUESTRA = !GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_MUESTRA_GOOGLE === "1";
/** Si hay botón de Google que mostrar (el real, o la muestra en el entorno de diseño). */
export const HAY_GOOGLE = Boolean(GOOGLE_CLIENT_ID) || MUESTRA;

const TEXTO_MUESTRA = { signin_with: "Iniciar sesión con Google", signup_with: "Registrarse con Google", continue_with: "Continuar con Google" };

function MuestraGoogle({ texto, bloqueado }: { texto: keyof typeof TEXTO_MUESTRA; bloqueado: boolean }) {
  return (
    <div title="Muestra del entorno de diseño: en la tienda publicada aparece el botón real de Google">
      <div aria-hidden="true" className={`mx-auto flex h-10 w-full max-w-[400px] items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white text-sm font-medium text-[#3c4043] ${bloqueado ? "opacity-50" : ""}`}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {TEXTO_MUESTRA[texto]}
      </div>
    </div>
  );
}
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
  /** Si la persona marcó la casilla de Términos (ingreso y registro la muestran). Sin ella, Google solo sirve para cuentas que ya existen. */
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

  if (MUESTRA) return <MuestraGoogle texto={texto} bloqueado={bloqueado} />;
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
