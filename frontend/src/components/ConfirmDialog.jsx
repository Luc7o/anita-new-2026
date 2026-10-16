import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import Dialog from "./Dialog.jsx";

// Reemplaza el confirm() feo del navegador por una ventana propia, con el
// mismo estilo de la tienda (y atrapa el foco / cierra con Escape).
//
//   const confirmar = useConfirm();
//   if (!(await confirmar({ title: "¿Cancelar el pedido?", message: "…", tone: "danger", confirmText: "Sí, cancelar" }))) return;

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogo, setDialogo] = useState(null);
  const resolverRef = useRef(null);

  const confirmar = useCallback(
    (opciones) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialogo(opciones);
      }),
    []
  );

  const cerrar = (resultado) => {
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    setDialogo(null);
  };

  const peligro = dialogo?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {dialogo && (
        <Dialog
          labelledBy="confirmar-titulo"
          onClose={() => cerrar(false)}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop"
        >
          <div className="flex gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                peligro ? "bg-red-50 text-red-700" : "bg-lilac text-berry"
              }`}
            >
              {peligro ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.6 3.2a1.6 1.6 0 012.8 0l6 10.8A1.6 1.6 0 0116 16.4H4a1.6 1.6 0 01-1.4-2.4l6-10.8zM10 7a.9.9 0 00-.9.9v2.8a.9.9 0 101.8 0V7.9A.9.9 0 0010 7zm0 6.2a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zM8.9 7.3c0-.6.5-1 1.2-1 .7 0 1.2.4 1.2 1 0 .4-.2.6-.7 1-.8.6-1.3 1.1-1.3 2.1a.8.8 0 001.6 0c0-.4.2-.6.7-1 .8-.6 1.3-1.2 1.3-2.1 0-1.5-1.2-2.5-2.8-2.5-1.6 0-2.8 1-2.8 2.5a.8.8 0 001.6 0zM10 14a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <h2 id="confirmar-titulo" className="font-sans text-lg font-bold text-plum">
                {dialogo.title}
              </h2>
              {dialogo.message && <p className="mt-1 text-sm text-plum-soft">{dialogo.message}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => cerrar(false)} className="btn-secondary btn">
              {dialogo.cancelText || "Volver"}
            </button>
            <button
              type="button"
              onClick={() => cerrar(true)}
              className={peligro ? "btn border border-red-700 bg-red-700 text-white hover:bg-red-800" : "btn-primary btn"}
            >
              {dialogo.confirmText || "Confirmar"}
            </button>
          </div>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
