import { BotonPreferencias } from "./BotonPreferencias";

const ENLACES = [
  ["Formas de pago", "/formas-de-pago"],
  ["Métodos de envío", "/metodos-de-envio"],
  ["Cambios y devoluciones", "/cambios-devoluciones"],
  ["Preguntas frecuentes", "/faq"],
  ["Contáctanos", "/contacto"],
  ["Nuestras tiendas", "/tiendas"],
  ["Quiénes somos", "/quienes-somos"],
  ["Reviews de clientes", "/reviews"],
] as const;

export function Pie() {
  return (
    <footer className="mt-20 border-t border-plum/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold">ANITA NEW STYLE</p>
          <p className="mt-2 max-w-sm text-sm text-plum-soft">Tienda de moda peruana. Delivery en Huancayo.</p>
          <a href="/libro-reclamaciones" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4 hover:text-berry">
            Libro de Reclamaciones Virtual
          </a>
        </div>
        <ul className="grid gap-2 text-sm">
          {ENLACES.map(([texto, ruta]) => (
            <li key={ruta}><a href={ruta} className="hover:text-berry">{texto}</a></li>
          ))}
        </ul>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 border-t border-plum/10 px-4 py-5 text-xs text-plum-soft">
        <span>© {new Date().getFullYear()} Anita New Style</span>
        <a href="/politica-de-privacidad" className="hover:text-berry">Política de privacidad</a>
        <a href="/terminos-y-condiciones" className="hover:text-berry">Términos y condiciones</a>
        <BotonPreferencias className="hover:text-berry" />
      </div>
    </footer>
  );
}
