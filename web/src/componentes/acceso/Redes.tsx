import { db } from "@/db";
import { configuracionTienda } from "@/db/schema";
import { IconoFacebook, IconoInstagram, IconoTikTok, IconoWhatsApp } from "@/componentes/Iconos";

function linkWhatsApp(numero: string | null) {
  const digitos = (numero || "").replace(/\D/g, "");
  if (digitos.length === 9) return `https://wa.me/51${digitos}`;
  if (digitos.length >= 11) return `https://wa.me/${digitos}`;
  return null;
}

// Redes de la tienda, desde Configuración (si un dato está vacío, ese ícono no sale).
export async function Redes() {
  const [c] = await db
    .select({
      whatsapp: configuracionTienda.whatsapp,
      facebook: configuracionTienda.facebookUrl,
      instagram: configuracionTienda.instagramUrl,
      tiktok: configuracionTienda.tiktokUrl,
    })
    .from(configuracionTienda)
    .limit(1);
  if (!c) return null;
  const clase = "text-plum-soft transition hover:text-berry";
  const enlaces = [
    [c.facebook, "Facebook", IconoFacebook],
    [c.instagram, "Instagram", IconoInstagram],
    [c.tiktok, "TikTok", IconoTikTok],
    [linkWhatsApp(c.whatsapp), "WhatsApp", IconoWhatsApp],
  ] as const;
  return (
    <div className="mt-6 flex items-center gap-4">
      {enlaces.map(([href, nombre, Icono]) =>
        href ? (
          <a key={nombre} href={href} target="_blank" rel="noopener noreferrer" aria-label={nombre} className={clase}>
            <Icono />
          </a>
        ) : null
      )}
    </div>
  );
}
