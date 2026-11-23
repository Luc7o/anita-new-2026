"use client";

import { useEffect, useState } from "react";
import { pedir, recuperarSesion } from "@/lib/api";

// "Ingresar" o "Mi cuenta" en la cabecera. Solo consulta al servidor si el navegador
// tiene señal de una sesión (el token CSRF del refresh): a quien nunca ingresó no le
// cuesta ninguna petición. Mi cuenta (/perfil) todavía vive en la SPA.
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

  if (nombre) {
    return (
      <a href="/perfil" className="max-w-36 truncate hover:text-berry" title="Mi cuenta">
        {nombre === "Mi cuenta" ? nombre : `Hola, ${nombre.split(" ")[0]}`}
      </a>
    );
  }
  return (
    <a href="/ingresar" className="hover:text-berry">
      Ingresar
    </a>
  );
}
