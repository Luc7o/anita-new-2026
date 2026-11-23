import Link from "next/link";
import { db } from "@/db";
import { configuracionTienda } from "@/db/schema";
import { IconoAtras, IconoFacebook, IconoInstagram, IconoTikTok, IconoWhatsApp } from "@/componentes/Iconos";

// Maqueta de las pantallas de acceso (ingresar, registro, recuperar y restablecer
// contraseña), igual que frontend/src/components/AuthLayout.jsx: columna de marca con
// foto a un lado y el formulario al otro.

const ALTO_MARCA = { 280: "min-h-[280px]", 320: "min-h-[320px]" } as const;
const PADDING_FORM = { 12: "py-12", 16: "py-16" } as const;
const ANCHO_FORM = { 420: "max-w-[420px]", 460: "max-w-[460px]" } as const;

function linkWhatsApp(numero: string | null) {
  const digitos = (numero || "").replace(/\D/g, "");
  if (digitos.length === 9) return `https://wa.me/51${digitos}`;
  if (digitos.length >= 11) return `https://wa.me/${digitos}`;
  return null;
}

// Redes de la tienda, desde Configuración (si un dato está vacío, ese ícono no sale).
async function Redes() {
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

export function Maqueta({
  imagen,
  posicionImagen,
  titulo,
  marca,
  conAtras = false,
  altoMarca = 320,
  anchoForm = 420,
  padY = 16,
  children,
}: {
  imagen: "login" | "registro";
  posicionImagen?: string;
  titulo: React.ReactNode;
  marca: React.ReactNode;
  conAtras?: boolean;
  altoMarca?: 280 | 320;
  anchoForm?: 420 | 460;
  padY?: 12 | 16;
  children: React.ReactNode;
}) {
  return (
    <main id="contenido" className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {conAtras && (
        <Link
          href="/"
          aria-label="Volver al inicio"
          title="Regresar a la tienda"
          className="group absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-plum shadow-glass backdrop-blur-sm transition hover:bg-white hover:text-berry sm:left-6 sm:top-6"
        >
          <IconoAtras size={18} />
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-plum/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            Regresar a la tienda
          </span>
        </Link>
      )}

      <div
        className={`relative flex ${ALTO_MARCA[altoMarca]} flex-col justify-end gap-6 overflow-hidden bg-cover ${posicionImagen ? "" : "bg-center"} p-6 sm:p-10 lg:w-1/2`}
        style={{ backgroundImage: `url(/acceso/${imagen}-hero.webp)`, ...(posicionImagen ? { backgroundPosition: posicionImagen } : {}) }}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">{titulo}</h1>
          {marca}
          <Redes />
        </div>
      </div>

      <div className={`flex flex-1 flex-col items-center justify-center bg-white px-6 ${PADDING_FORM[padY]} sm:px-16 lg:w-1/2`}>
        <div className={`w-full ${ANCHO_FORM[anchoForm]}`}>{children}</div>
      </div>
    </main>
  );
}
