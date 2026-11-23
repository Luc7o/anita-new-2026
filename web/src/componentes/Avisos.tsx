"use client";

import { useCallback, useState } from "react";

// Avisos breves (toasts) abajo de la pantalla: éxito, error o información.
export type TipoAviso = "success" | "error" | "info";
type Aviso = { id: number; tipo: TipoAviso; texto: string };

export function useAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const avisar = useCallback((tipo: TipoAviso, texto: string) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, tipo, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === "error" ? 6000 : 3500);
  }, []);
  return { avisos, avisar };
}

export function ListaAvisos({ avisos }: { avisos: Aviso[] }) {
  return (
    <div aria-live="polite" className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {avisos.map((a) => (
        <p
          key={a.id}
          role={a.tipo === "error" ? "alert" : "status"}
          className={`animate-fade-in-up rounded-xl px-4 py-3 text-sm font-semibold shadow-pop ${
            a.tipo === "error" ? "bg-peligro-fuerte text-white" : a.tipo === "success" ? "bg-berry text-white" : "bg-plum text-ivory"
          }`}
        >
          {a.texto}
        </p>
      ))}
    </div>
  );
}

/** Lee (y borra) los avisos que dejó otra página antes de una recarga completa. */
export function tomarAvisosPendientes(clave: string): { tipo: TipoAviso; texto: string }[] {
  try {
    const crudo = sessionStorage.getItem(clave);
    if (!crudo) return [];
    sessionStorage.removeItem(clave);
    const lista = JSON.parse(crudo);
    return Array.isArray(lista)
      ? lista.filter((a) => a && typeof a.texto === "string" && ["success", "error", "info"].includes(a.tipo))
      : [];
  } catch {
    return [];
  }
}
