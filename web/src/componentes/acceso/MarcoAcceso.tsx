import Link from "next/link";
import { IconoAtras } from "@/componentes/Iconos";

// Marco de las pantallas de acceso (ingresar, crear cuenta, recuperar y nueva contraseña):
// fondo blanco, logo arriba y una tarjeta con el formulario a la izquierda y un panel negro
// con borde en diagonal a la derecha. En celular el formulario va primero y el panel debajo.
// Con panelIzquierda el panel se desliza suavemente hacia la izquierda y el formulario hacia
// la derecha (así cambian ingresar y crear cuenta). Con panelDoble el panel es como una hoja:
// lleva por dentro los dos textos lado a lado y, al deslizarse, uno sale y el otro entra
// deslizándose también, sin aparecer ni desaparecer.

// Escrita completa para que Tailwind la encuentre al compilar. Recorrido largo y con
// arranque y frenado suaves; con "reducir movimiento" el cambio es directo.
const DESLIZAR = "md:duration-[900ms] md:ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:duration-0";

/** Botón o enlace del panel negro: contorno blanco que se rellena al pasar el mouse. */
export const BOTON_PANEL =
  "mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/80 px-6 text-sm font-bold text-white transition-colors duration-300 hover:bg-white hover:text-carbon";

/** Contenido típico del panel negro: antetítulo, título en Bodoni con una palabra en rosa, texto y acción. */
export function PanelTexto({ antetitulo, titulo, texto, accion }: {
  antetitulo: string;
  titulo: React.ReactNode;
  texto: string;
  accion: React.ReactNode;
}) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">{antetitulo}</p>
      <h2 className="mt-3 font-display text-[clamp(2.2rem,3.6vw,3rem)] leading-[1.02] text-white [&_em]:text-berry-light">{titulo}</h2>
      <p className="mt-4 max-w-[30ch] text-[15px] leading-relaxed text-white/80">{texto}</p>
      {accion}
    </>
  );
}

export function MarcoAcceso({ titulo, panel, panelDoble, pie, panelIzquierda = false, children }: {
  /** Título de la página para lectores de pantalla (el visible está en el formulario). */
  titulo: string;
  panel: React.ReactNode;
  /** Contenido del panel según el lado en que esté (solo escritorio; en celular se usa panel). */
  panelDoble?: { izquierda: React.ReactNode; derecha: React.ReactNode };
  /** Debajo del panel (por ejemplo, las redes de la tienda). */
  pie?: React.ReactNode;
  /** En escritorio, el panel negro a la izquierda y el formulario a la derecha. */
  panelIzquierda?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main id="contenido" className="relative flex min-h-svh flex-col items-center justify-center bg-ivory px-4 py-20 sm:px-8 md:h-svh md:min-h-[560px] md:py-6 bajo:md:py-4">
      <Link
        href="/"
        className="absolute left-4 top-5 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-plum-soft transition-colors hover:text-plum sm:left-8 sm:top-7"
      >
        <IconoAtras size={16} /> Volver a la tienda
      </Link>

      <Link href="/" aria-label="Anita New Style, ir al inicio" className="mb-7 whitespace-nowrap font-display md:mb-5 md:mt-3 bajo:md:mt-0 bajo:md:mb-3 text-xl font-bold tracking-wide text-plum sm:text-2xl">
        ANITA <span className="text-berry">NEW</span> STYLE
      </Link>

      <h1 className="sr-only">{titulo}</h1>

      {/* En computadora la tarjeta toma el alto que queda (hasta 660 px): la página entra
          completa en la pantalla sin desplazarse. En celular sí se desplaza. */}

      <div className="relative flex w-full max-w-[960px] flex-col overflow-hidden rounded-[28px] border border-plum/10 bg-ivory shadow-[0_30px_70px_-35px_rgb(28_26_29/0.4)] md:block md:min-h-0 md:w-full md:flex-1 md:max-h-[660px]">
        <div
          className={`relative px-7 py-10 sm:px-12 md:flex md:h-full md:overflow-y-auto md:py-8 bajo:md:py-5 md:w-1/2 md:flex-col md:justify-center-safe md:px-14 md:transition-transform ${DESLIZAR} ${
            panelIzquierda ? "md:translate-x-full" : "md:translate-x-0"
          }`}
        >
          <div className="mx-auto w-full max-w-[380px]">{children}</div>
        </div>

        <div
          className={`relative bg-black md:absolute md:inset-y-0 md:left-0 md:z-10 md:w-1/2 md:overflow-hidden md:transition-[translate,clip-path] ${DESLIZAR} ${
            panelIzquierda
              ? "md:translate-x-0 md:[clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]"
              : "md:translate-x-full md:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]"
          }`}
        >
          {/* Celular (y páginas de un solo panel): el contenido tal cual. */}
          <div className={`px-7 py-10 sm:px-12 md:h-full md:flex-col md:justify-center md:px-20 ${panelDoble ? "md:hidden" : "md:flex"}`}>
            {panel}
            {pie && <div className="[&_a]:text-white/75 [&_a:hover]:text-white">{pie}</div>}
          </div>

          {/* Escritorio con dos lados: una tira del doble de ancho con los dos textos. Mientras
              el panel va hacia un lado, la tira va hacia el otro y cada texto se desliza un poco
              más (efecto de profundidad), así el cambio se ve como una hoja que se corre. */}
          {panelDoble && (
            <div
              className={`absolute inset-y-0 left-0 hidden w-[200%] md:flex md:transition-transform ${DESLIZAR} ${
                panelIzquierda ? "md:translate-x-0" : "md:-translate-x-1/2"
              }`}
            >
              {([
                ["izquierda", panelDoble.izquierda, panelIzquierda ? "md:translate-x-0" : "md:-translate-x-1/5"],
                ["derecha", panelDoble.derecha, panelIzquierda ? "md:translate-x-1/5" : "md:translate-x-0"],
              ] as const).map(([lado, contenido, desplazamiento]) => {
                const visible = (lado === "izquierda") === panelIzquierda;
                return (
                  <div
                    key={lado}
                    inert={!visible || undefined}
                    aria-hidden={!visible || undefined}
                    className={`flex h-full w-1/2 flex-col justify-center md:transition-transform ${DESLIZAR} ${desplazamiento} ${
                      lado === "izquierda" ? "pl-14 pr-24" : "pl-24 pr-14"
                    }`}
                  >
                    {contenido}
                    {pie && <div className="[&_a]:text-white/75 [&_a:hover]:text-white">{pie}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
