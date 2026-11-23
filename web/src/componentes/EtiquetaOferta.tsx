import { soles } from "@/lib/precio";

// Etiqueta kraft colgante de toda pieza en oferta (estilos .colgante/.etiqueta-kraft en theme.css).
export function EtiquetaOferta({ precio, antes, chica = false, className = "" }: { precio: number; antes: number; chica?: boolean; className?: string }) {
  return (
    <div className={`colgante ${chica ? "chico" : ""} ${className}`}>
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <path d="M15 0 C 15 10, 15 20, 15 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <div className={`etiqueta-kraft ${chica ? "chica" : ""}`}>
        <span className="que">Oferta</span>
        <span className="p">{soles(precio)}</span>
        <s><span className="sr-only">Antes </span>{soles(antes)}</s>
      </div>
    </div>
  );
}
