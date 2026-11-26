import type { Metadata } from "next";
import { db } from "@/db";
import { configuracionTienda } from "@/db/schema";
import { IconoCorreo, IconoWhatsApp } from "@/componentes/Iconos";
import { enlaceWhatsApp } from "@/lib/tienda";

export const metadata: Metadata = { title: "Ayuda" };
export const revalidate = 300;

const MENSAJE = "Hola, tengo una consulta sobre mi cuenta en Anita New Style";

// Primero el WhatsApp de Configuración; si está vacío, el de soporte.
function linkWhatsApp(numero: string | null) {
  const digitos = (numero || "").replace(/\D/g, "");
  const base = digitos.length === 9 ? `https://wa.me/51${digitos}` : digitos.length >= 11 ? `https://wa.me/${digitos}` : null;
  return base ? `${base}?text=${encodeURIComponent(MENSAJE)}` : enlaceWhatsApp(MENSAJE);
}

export default async function PaginaAyuda() {
  const [c] = await db
    .select({ whatsapp: configuracionTienda.whatsapp, correo: configuracionTienda.correoContacto })
    .from(configuracionTienda)
    .limit(1);
  const whatsapp = linkWhatsApp(c?.whatsapp ?? null);
  const mailto = c?.correo ? `mailto:${c.correo}?subject=${encodeURIComponent("Consulta sobre mi cuenta")}` : null;

  return (
    <div>
      <h2 className="font-display text-3xl text-plum">¿Necesitas ayuda?</h2>
      <p className="mt-2 text-sm text-plum-soft">Si tienes dudas sobre un pedido, un pago o tu cuenta, escríbenos por cualquiera de estos medios.</p>
      <ul className="mt-6 border-t border-plum">
        {whatsapp && (
          <li className="border-b border-plum/10">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-plum/15 text-plum"><IconoWhatsApp size={18} /></span>
              <span className="flex-1">
                <span className="block font-semibold text-plum group-hover:underline group-hover:underline-offset-4">Escribir por WhatsApp</span>
                <span className="block text-sm text-plum-soft">La forma más rápida de resolver tu duda.</span>
              </span>
              <span aria-hidden="true" className="text-plum-soft transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </li>
        )}
        {mailto && (
          <li className="border-b border-plum/10">
            <a href={mailto} className="group flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-plum/15 text-plum"><IconoCorreo size={18} /></span>
              <span className="flex-1">
                <span className="block font-semibold text-plum group-hover:underline group-hover:underline-offset-4">Escribir un correo</span>
                <span className="block text-sm text-plum-soft">Para consultas con más detalle o con archivos.</span>
              </span>
              <span aria-hidden="true" className="text-plum-soft transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </li>
        )}
        {/* Sin WhatsApp ni correo configurados: al menos la página de contacto. */}
        {!whatsapp && !mailto && (
          <li className="border-b border-plum/10">
            <a href="/contacto" className="group flex items-center gap-4 py-4">
              <span className="flex-1 font-semibold text-plum group-hover:underline group-hover:underline-offset-4">Ver cómo contactarnos</span>
              <span aria-hidden="true" className="text-plum-soft transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
