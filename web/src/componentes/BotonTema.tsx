"use client";

// Botón de modo noche / modo claro de la tienda. Muestra el modo actual: luna en oscuro y sol en
// claro; al tocarlo, una se va girando y la otra entra. El ícono depende solo de la clase .dark
// del <html> (CSS), así que no hay parpadeo ni desajuste al hidratar. La elección se guarda en
// anita-tema, que layout.tsx aplica antes de pintar la página.
export function BotonTema() {
  const cambiar = () => {
    const raiz = document.documentElement;
    const oscuro = !raiz.classList.contains("dark");
    const aplicar = () => {
      raiz.classList.toggle("dark", oscuro);
      try {
        localStorage.setItem("anita-tema", oscuro ? "dark" : "light");
      } catch {}
    };
    // Fundido suave entre los dos modos donde el navegador lo permite.
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!quieto && "startViewTransition" in document) document.startViewTransition(aplicar);
    else aplicar();
  };

  const icono =
    "absolute inset-0 m-auto h-[22px] w-[22px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label="Cambiar entre modo claro y modo noche"
      className="relative grid h-10 w-10 place-items-center rounded-full text-plum transition-colors hover:text-berry focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--c-focus))]"
    >
      {/* Sol: visible en modo claro */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        aria-hidden="true"
        className={`${icono} rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-50 dark:opacity-0`}
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
      {/* Luna: visible en modo noche */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${icono} rotate-90 scale-50 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100`}
      >
        <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z" />
      </svg>
    </button>
  );
}
