// Aceptación de Términos y Política de Privacidad. SIEMPRE empieza sin marcar y los
// enlaces abren en otra pestaña para no perder lo escrito.
export function CasillaTerminos({ id, checked, onChange, className = "" }: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-2.5 text-xs text-plum-soft ${className}`}>
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border-plum/30 accent-berry"
      />
      <span>
        He leído y acepto los{" "}
        <a href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">
          Términos y Condiciones
        </a>{" "}
        y la{" "}
        <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-berry hover:underline">
          Política de Privacidad
        </a>
        .
      </span>
    </label>
  );
}
