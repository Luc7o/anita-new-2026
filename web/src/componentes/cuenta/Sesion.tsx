"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cerrarSesion, pedir, recuperarSesion } from "@/lib/api";
import { ListaAvisos, useAvisos, type TipoAviso } from "@/componentes/Avisos";

// Sesión para las páginas de la cuenta (perfil, pedidos, configuración…). Sin sesión
// manda a /ingresar?volver=<esta página>, así al ingresar vuelve aquí.

export type UsuarioCuenta = {
  id: number;
  nombre: string | null;
  apellido: string | null;
  nombre_completo?: string | null;
  email: string;
  telefono?: string | null;
  es_invitado?: boolean;
};

type Confirmacion = { titulo: string; mensaje?: string; confirmar: string; cancelar: string; peligro?: boolean };

type Sesion = {
  usuario: UsuarioCuenta;
  setUsuario: (u: UsuarioCuenta) => void;
  salir: (aviso?: string) => Promise<void>;
  avisar: (tipo: TipoAviso, texto: string) => void;
  confirmar: (c: Confirmacion) => Promise<boolean>;
};

const Contexto = createContext<Sesion | null>(null);

export function useSesion() {
  const s = useContext(Contexto);
  if (!s) throw new Error("useSesion fuera de <ProveedorSesion>");
  return s;
}

/** Deja un aviso para la próxima página (se muestra tras la recarga completa). */
export function avisoParaDespues(tipo: TipoAviso, texto: string) {
  try {
    sessionStorage.setItem("ans_aviso_siguiente", JSON.stringify([{ tipo, texto }]));
  } catch {
    // sin sessionStorage no se muestra, no es grave
  }
}

export function ProveedorSesion({ children, cargando }: { children: React.ReactNode; cargando: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioCuenta | null>(null);
  const { avisos, avisar } = useAvisos();
  const [pregunta, setPregunta] = useState<Confirmacion | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const u = (await recuperarSesion()) ? await pedir<UsuarioCuenta>("/auth/perfil", { auth: true }).catch(() => null) : null;
      if (!vigente) return;
      if (u) {
        setUsuario(u);
        return;
      }
      const volver = window.location.pathname + window.location.search;
      window.location.replace(`/ingresar?volver=${encodeURIComponent(volver)}`);
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const salir = useCallback(async (aviso = "Cerraste sesión") => {
    await cerrarSesion();
    avisoParaDespues("info", aviso);
    window.location.assign("/");
  }, []);

  const confirmar = useCallback((c: Confirmacion) => {
    setPregunta(c);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (pregunta) dialogo.current?.showModal();
  }, [pregunta]);

  const responder = (si: boolean) => {
    dialogo.current?.close();
    setPregunta(null);
    resolver.current?.(si);
    resolver.current = null;
  };

  if (!usuario) return <>{cargando}</>;

  return (
    <Contexto.Provider value={{ usuario, setUsuario, salir, avisar, confirmar }}>
      {children}
      <ListaAvisos avisos={avisos} />
      <dialog
        ref={dialogo}
        onCancel={(e) => {
          e.preventDefault();
          responder(false);
        }}
        aria-labelledby="confirmar-titulo"
        className="m-auto w-[min(92vw,420px)] rounded-2xl bg-white p-6 text-plum shadow-pop backdrop:bg-plum/40"
      >
        {pregunta && (
          <>
            <h2 id="confirmar-titulo" className="text-lg font-semibold">{pregunta.titulo}</h2>
            {pregunta.mensaje && <p className="mt-2 text-sm text-plum-soft">{pregunta.mensaje}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => responder(false)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-plum ring-1 ring-plum/15 hover:bg-plum/5"
              >
                {pregunta.cancelar}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => responder(true)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${pregunta.peligro ? "bg-berry-dark hover:bg-berry" : "bg-plum hover:bg-berry-dark"}`}
              >
                {pregunta.confirmar}
              </button>
            </div>
          </>
        )}
      </dialog>
    </Contexto.Provider>
  );
}
