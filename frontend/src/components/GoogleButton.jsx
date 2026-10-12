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
export default function GoogleButton({ onSuccess, onError, texto = "continue_with" }) {
  const { loginConGoogle } = useAuth();
  const contenedor = useRef(null);
  const [fallo, setFallo] = useState(false);

  // Guardamos los callbacks en refs para no re-inicializar Google en cada render.
  const alExito = useRef(onSuccess);
  const alError = useRef(onError);
  alExito.current = onSuccess;
  alError.current = onError;

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
              const usuario = await loginConGoogle(credential);
              alExito.current?.(usuario);
            } catch (err) {
              alError.current?.(err.message || "No se pudo iniciar sesión con Google");
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
  return (
    <div>
      <div ref={contenedor} className="flex w-full justify-center" />
      <p className="mt-3 text-center text-xs text-plum-soft">
        Al continuar con Google aceptas nuestros{" "}
        <Link to="/terminos-y-condiciones" className="font-semibold text-berry hover:underline">Términos</Link> y la{" "}
        <Link to="/politica-de-privacidad" className="font-semibold text-berry hover:underline">Política de privacidad</Link>.
      </p>
    </div>
  );
  return <div ref={contenedor} className="flex w-full justify-center" />;
}
