import React, { createContext, useContext } from "react";
import { Toast } from "@animate-ui/react/primitives/base-ui/toast";

// Avisos breves ("toasts") para confirmar acciones: guardar, eliminar, agregar…
//   const toast = useToast();
//   toast.success("Producto guardado");   toast.error("No se pudo guardar");
//   toast.warning("…");                    toast.info("…");
//
// Salen ABAJO y centrados, para no tapar el menú (ni los botones del carrito lateral).
// Usan el Toast de Animate UI sobre Base UI: suben desde el borde, se apilan, se pausan al
// pasar el mouse, se descartan deslizando y muestran una barra con el tiempo que les queda.

const ToastContext = createContext(null);

// Íconos de trazo (no de relleno): Animate UI «dibuja» el check y la X al aparecer.
const trazo = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-5 w-5",
  "aria-hidden": true,
};
const ICONOS = {
  success: (
    <svg {...trazo}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  error: (
    <svg {...trazo}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  ),
  warning: (
    <svg {...trazo}>
      <path d="M10.3 3.9L2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" />
    </svg>
  ),
  info: (
    <svg {...trazo}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4.5M12 8h.01" />
    </svg>
  ),
};

// Color del círculo del ícono según el tipo; la tarjeta es la misma para todos.
const COLOR_ICONO = {
  success: "bg-berry text-white",
  error: "bg-red-600 text-white",
  warning: "bg-amber-500 text-carbon",
  info: "bg-plum text-ivory",
};

const DURACION = { success: 3500, info: 4000, warning: 6000, error: 6000 };
const MAXIMO = 4;

// Un solo gestor para toda la app: así toast.success(...) funciona desde cualquier parte.
const gestor = Toast.createToastManager();

const mostrar = (tipo) => (mensaje) =>
  gestor.add({
    description: mensaje,
    type: tipo,
    timeout: DURACION[tipo],
    priority: tipo === "error" ? "high" : "low", // los errores se anuncian al lector de pantalla
  });

// Objeto estable: usarlo dentro de useEffect/useCallback no provoca bucles.
const API = {
  success: mostrar("success"),
  error: mostrar("error"),
  warning: mostrar("warning"),
  info: mostrar("info"),
};

function ListaAvisos() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} swipeDirection={["down", "left", "right"]} className="aviso">
      <Toast.Content className="flex items-center gap-3 overflow-hidden py-3 pl-3 pr-2">
        <span
          data-slot="toast-icon"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${COLOR_ICONO[t.type] || COLOR_ICONO.info}`}
        >
          {ICONOS[t.type] || ICONOS.info}
        </span>
        <Toast.Description className="min-w-0 flex-1 text-sm font-semibold leading-snug text-plum" />
        <Toast.Close
          aria-label="Cerrar aviso"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-plum-soft transition-colors hover:bg-plum/5 hover:text-plum"
        >
          <svg {...trazo} className="h-4 w-4">
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={API}>
      <Toast.Provider toastManager={gestor} limit={MAXIMO}>
        {children}
        <Toast.Portal>
          <Toast.Viewport className="avisos">
            <ListaAvisos />
          </Toast.Viewport>
        </Toast.Portal>
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
