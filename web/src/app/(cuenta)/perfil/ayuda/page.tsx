import type { Metadata } from "next";
import { db } from "@/db";
import { configuracionTienda } from "@/db/schema";
import { IconoCorreo, IconoWhatsApp } from "@/componentes/Iconos";
import { enlaceWhatsApp } from "@/lib/tienda";

export const metadata: Metadata = { title: "Ayuda" };
export const revalidate = 300;

const MENSAJE = "Hola, tengo una consulta sobre mi cuenta en Anita New Style";

// Igual que la SPA: primero el WhatsApp de Configuración; si está vacío, el de soporte.
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
    <div className="glass space-y-5 rounded-3xl p-6 shadow-glass sm:p-8">
      <h2 className="text-xl font-semibold text-plum">¿Necesitas ayuda?</h2>
      <p className="text-sm text-plum-soft">Si tienes dudas sobre un pedido, un pago o tu cuenta, puedes escribirnos por estos medios.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white"
          >
            <IconoWhatsApp size={18} className="text-berry" />
            Escribir por WhatsApp
          </a>
        )}
        {mailto && (
          <a
            href={mailto}
            className="flex flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white"
          >
            <IconoCorreo size={18} className="text-berry" />
            Escribir un correo
          </a>
        )}
      </div>
    </div>
  );
}
