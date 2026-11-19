import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

// Carga el script de Google una sola vez, aunque el botón se monte varias
// veces (Login y Registro).
let promesaScript = null;
function cargarScriptGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!promesaScript) {
    promesaScript = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => {
        promesaScript = null;
        reject(new Error("No se pudo cargar Google"));
      };
      document.head.appendChild(s);
    });
  }
  return promesaScript;
}

/**
 * Botón oficial "Continuar con Google". Sirve igual para iniciar sesión y
 * para registrarse: el backend crea la cuenta si todavía no existe.
 * Si falta VITE_GOOGLE_CLIENT_ID no se muestra nada.
 */
export default function GoogleButton({ onSuccess, onError, texto = "continue_with", aceptaTerminos, bloqueado = false }) {
  const { loginConGoogle } = useAuth();
  const contenedor = useRef(null);
  const [fallo, setFallo] = useState(false);

  // Guardamos los callbacks en refs para no re-inicializar Google en cada render.
  const alExito = useRef(onSuccess);
  const alError = useRef(onError);
  alExito.current = onSuccess;
  alError.current = onError;
  // Si quien lo usa muestra la casilla de términos (página de registro), pasa su valor;
  // si no (inicio de sesión), solo sirve para entrar a una cuenta que ya existe.
  const aceptaRef = useRef(aceptaTerminos);
  aceptaRef.current = aceptaTerminos;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelado = false;

    cargarScriptGoogle()
      .then(() => {
        if (cancelado || !contenedor.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              const usuario = await loginConGoogle(credential, aceptaRef.current === true);
              alExito.current?.(usuario);
            } catch (err) {
              alError.current?.(err.message || "No se pudo iniciar sesión con Google");
            }
          },
        });
        window.google.accounts.id.renderButton(contenedor.current, {
          type: "standard",
          theme: "outline-solid",
          size: "large",
          text: texto,
          shape: "pill",
          locale: "es",
          width: Math.min(contenedor.current.offsetWidth || 380, 400),
        });
      })
      .catch(() => !cancelado && setFallo(true));

    return () => {
      cancelado = true;
    };
  }, [loginConGoogle, texto]);

  if (!CLIENT_ID) return null;
  if (fallo) {
    return (
      <p className="text-center text-xs text-plum-soft">
        No se pudo cargar Google. Revisa tu conexión o desactiva el bloqueador de anuncios.
      </p>
    );
  }
  const conCasilla = aceptaTerminos !== undefined;
  return (
    <div>
      <div className="relative">
        {/* Mientras la casilla no esté marcada, el botón (que dibuja Google dentro de un
            iframe) queda tapado e inerte: ni con el mouse ni con el teclado se puede usar. */}
        <div ref={contenedor} inert={bloqueado ? "" : undefined} className={`flex w-full justify-center ${bloqueado ? "opacity-50" : ""}`} />
        {bloqueado && (
          <button
            type="button"
            onClick={() => alError.current?.("Marca la casilla de Términos y Política de Privacidad para continuar con Google.")}
            className="absolute inset-0 cursor-not-allowed"
            aria-label="Marca primero la casilla de Términos y Política de Privacidad para continuar con Google"
          />
        )}
      </div>
      {!conCasilla && (
        <p className="mt-3 text-center text-xs text-plum-soft">
          Si ya tienes cuenta, entra con Google. Para crear una cuenta nueva,{" "}
          <Link to="/registro" className="font-semibold text-berry hover:underline">regístrate aquí</Link>{" "}
          y acepta los Términos y la Política de privacidad.
        </p>
      )}
    </div>
  );
}
