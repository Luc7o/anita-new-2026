// Reseñas reales (GET /api/resenas): solo pueden reseñar quienes compraron el producto.
export type Resena = {
  id: number;
  autor: string;
  calificacion: number;
  comentario: string | null;
  compra_verificada: boolean;
  fecha_creacion: string;
  producto: { id: number; nombre: string; imagen_url: string | null };
};
export type PaginaResenas = {
  resenas: Resena[];
  total: number;
  promedio: number | null;
  distribucion: Record<string, number>;
  hay_mas: boolean;
};

export const POR_PAGINA = 12;

export function Estrellas({ valor, size = 16 }: { valor: number; size?: number }) {
  const llenas = Math.round(valor);
  return (
    <span className="flex items-center gap-0.5 text-plum" role="img" aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={n <= llenas ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
          <path d="M11.5 2.3a.6.6 0 0 1 1 0l2.6 5.3 5.8.9a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.8.6L12 17.3l-5.2 2.7a.6.6 0 0 1-.8-.6l1-5.8L2.8 9.5a.6.6 0 0 1 .3-1l5.8-.9z" />
        </svg>
      ))}
    </span>
  );
}
