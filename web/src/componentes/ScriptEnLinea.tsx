// Script en línea que corre mientras el navegador lee el HTML, antes de pintar (por ejemplo,
// para aplicar el modo noche sin parpadeo). En el servidor sale como JavaScript; en el
// navegador React lo marca como texto, así no intenta crearlo de nuevo ni avisa «Encountered
// a script tag…» en desarrollo. suppressHydrationWarning acepta esa diferencia de tipo.
// Es la receta de la guía de Next «preventing-flash-before-hydration».
export function ScriptEnLinea({ codigo }: { codigo: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: codigo }}
    />
  );
}
