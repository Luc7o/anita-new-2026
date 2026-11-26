"use client";

import { useEffect, useState } from "react";
import { pedir, recuperarSesion } from "@/lib/api";

// "Ingresar" o "Mi cuenta" en la cabecera. Solo consulta al servidor si el navegador
// tiene señal de una sesión (el token CSRF del refresh): a quien nunca ingresó no le
// cuesta ninguna petición.
function haySenalDeSesion() {
  if (/(?:^|; )csrf_refresh_token=/.test(document.cookie)) return true;
  try {
    return Boolean(localStorage.getItem("ans_csrf_refresh"));
  } catch {
    return false;
  }
}

export function MenuCuenta() {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (!haySenalDeSesion()) return;
    let vigente = true;
    (async () => {
      if (!(await recuperarSesion())) return;
      const u = await pedir<{ nombre: string | null; es_invitado?: boolean }>("/auth/perfil", { auth: true }).catch(() => null);
      if (vigente && u) setNombre(u.nombre?.trim() || "Mi cuenta");
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // En celular se muestra solo el ícono de persona (el texto no cabe junto al logo).
  const texto = nombre ? (nombre === "Mi cuenta" ? nombre : `Hola, ${nombre.split(" ")[0]}`) : "Ingresar";
  return (
    <a
      href={nombre ? "/perfil" : "/ingresar"}
      title={nombre ? "Mi cuenta" : undefined}
      aria-label={texto}
      className="grid h-10 w-10 place-items-center rounded-full hover:text-berry sm:flex sm:h-auto sm:w-auto sm:max-w-36"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" className="h-[22px] w-[22px] sm:hidden">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
      </svg>
      <span className="hidden truncate sm:inline">{texto}</span>
    </a>
  );
}
