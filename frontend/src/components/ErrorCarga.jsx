import React from "react";

/**
 * Estado de error de carga, compartido por tienda y panel.
 * Se distingue de un estado vacío ("no hay datos") y ofrece reintentar,
 * para que un fallo de red no parezca una lista vacía ni deje un esqueleto
 * cargando para siempre.
 */
export default function ErrorCarga({
  titulo = "No se pudo cargar la información",
  mensaje,
  onReintentar,
  children,
  className = "",
}) {
  return (
    <div
      role="alert"
      className={`glass flex flex-col items-center gap-3 rounded-2xl p-8 text-center ${className}`}
    >
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      <p className="max-w-sm text-sm text-plum-soft">
        {mensaje || "Revisa tu conexión e inténtalo de nuevo."}
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="btn btn-primary px-6!">
            Reintentar
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
