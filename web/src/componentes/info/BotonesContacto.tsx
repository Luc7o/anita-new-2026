import Link from "next/link";
import { configTienda, linkWhatsApp } from "@/lib/configTienda";
import { IconoCorreo, IconoWhatsApp } from "@/componentes/Iconos";

const principal =
  "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark";
const secundario =
  "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white/70 px-5 py-3 text-sm font-medium text-plum shadow-glass transition hover:bg-white";

// WhatsApp y correo de Configuración. Si falta un dato ese botón no sale; si faltan los
// dos, se lleva a /contacto.
export async function BotonesContacto({ mensaje, asunto }: { mensaje: string; asunto?: string }) {
  const c = await configTienda();
  const base = linkWhatsApp(c.whatsapp);
  const wa = base ? `${base}?text=${encodeURIComponent(mensaje)}` : null;
  const mailto = c.correo_contacto ? `mailto:${c.correo_contacto}${asunto ? `?subject=${encodeURIComponent(asunto)}` : ""}` : null;
  if (!wa && !mailto) {
    return <Link href="/contacto" className={principal}>Ir a Contacto</Link>;
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={principal}>
          <IconoWhatsApp size={18} />
          Escribir por WhatsApp
        </a>
      )}
      {mailto && (
        <a href={mailto} className={wa ? secundario : principal}>
          <IconoCorreo size={18} />
          Enviar correo
        </a>
      )}
    </div>
  );
}
