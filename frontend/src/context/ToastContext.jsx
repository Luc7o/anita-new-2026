import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Avisos breves ("toasts") para confirmar acciones: guardar, eliminar, agregar…
//   const toast = useToast();
//   toast.success("Producto guardado");   toast.error("No se pudo guardar");
//   toast.warning("…");                    toast.info("…");

const ToastContext = createContext(null);

const ICONOS = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v3a1 1 0 11-2 0V9zm1-4a1.2 1.2 0 100 2.4A1.2 1.2 0 0010 5z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M8.6 3.2a1.6 1.6 0 012.8 0l6 10.8A1.6 1.6 0 0116 16.4H4a1.6 1.6 0 01-1.4-2.4l6-10.8zM10 7a.9.9 0 00-.9.9v2.8a.9.9 0 101.8 0V7.9A.9.9 0 0010 7zm0 6.2a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 6.5a1 1 0 112 0 1 1 0 01-2 0zm.25 3a.75.75 0 000 1.5h.25v2.5h-.25a.75.75 0 000 1.5h2a.75.75 0 000-1.5h-.25v-3.25a.75.75 0 00-.75-.75h-1.25z" clipRule="evenodd" />
    </svg>
  ),
};

const ESTILOS = {
  success: "bg-emerald-700",
  error: "bg-red-700",
  warning: "bg-amber-700",
  info: "bg-plum",
};

const DURACION = { success: 3500, info: 4000, warning: 6000, error: 6000 };
const MAXIMO = 4;

function Aviso({ aviso, onCerrar }) {
  const temporizador = useRef(null);

  const iniciar = useCallback(
    (ms) => {
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => onCerrar(aviso.id), ms);
    },
    [aviso.id, onCerrar]
  );

  useEffect(() => {
    iniciar(DURACION[aviso.tipo]);
    return () => clearTimeout(temporizador.current);
  }, [aviso.tipo, iniciar]);

  return (
    <div
      role={aviso.tipo === "error" ? "alert" : "status"}
      // Al pasar el cursor o enfocar, el aviso se queda para poder leerlo.
      onMouseEnter={() => clearTimeout(temporizador.current)}
      onMouseLeave={() => iniciar(2000)}
      onFocus={() => clearTimeout(temporizador.current)}
      onBlur={() => iniciar(2000)}
      className={`pointer-events-auto flex w-full max-w-sm animate-slide-in-right items-start gap-3 rounded-[10px] px-4 py-3 text-sm font-medium text-white shadow-pop ${ESTILOS[aviso.tipo]}`}
    >
      <span className="mt-0.5 shrink-0">{ICONOS[aviso.tipo]}</span>
      <span className="min-w-0 flex-1 leading-snug">{aviso.mensaje}</span>
      <button
        type="button"
        onClick={() => onCerrar(aviso.id)}
        aria-label="Cerrar aviso"
        className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M5.3 5.3a1 1 0 011.4 0L10 8.6l3.3-3.3a1 1 0 111.4 1.4L11.4 10l3.3 3.3a1 1 0 01-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 01-1.4-1.4L8.6 10 5.3 6.7a1 1 0 010-1.4z" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const contador = useRef(0);

  const cerrar = useCallback((id) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const mostrar = useCallback((mensaje, tipo) => {
    const id = ++contador.current;
    setAvisos((prev) => [...prev, { id, mensaje, tipo }].slice(-MAXIMO));
  }, []);

  // Objeto estable: así usarlo dentro de useEffect/useCallback no provoca bucles.
  const toastRef = useRef({
    success: (m) => mostrar(m, "success"),
    error: (m) => mostrar(m, "error"),
    warning: (m) => mostrar(m, "warning"),
    info: (m) => mostrar(m, "info"),
  });

  return (
    <ToastContext.Provider value={toastRef.current}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end sm:px-0"
      >
        {avisos.map((a) => (
          <Aviso key={a.id} aviso={a} onCerrar={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
