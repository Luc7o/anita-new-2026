"use client";

import { useState } from "react";
import { urlMapaEmbed, urlMapaEnlace } from "@/lib/mapa";

// Mapa de Google que NO se carga hasta que la persona lo pide: al incrustarlo, Google
// recibe su IP y puede guardar cookies, y eso no debe pasar solo por entrar a la página.
export function MapaTienda({ direccion, ciudad, maps_url, className = "" }: { direccion: string; ciudad: string; maps_url: string; className?: string }) {
  const [cargar, setCargar] = useState(false);
  const src = urlMapaEmbed({ direccion, ciudad, maps_url });
  if (!src) return null;

  if (cargar) {
    return (
      <iframe
        title="Ubicación de la tienda en Google Maps"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={`h-64 w-full rounded-2xl border-0 shadow-glass ${className}`}
      />
    );
  }

  const enlace = urlMapaEnlace({ direccion, ciudad, maps_url });
  return (
    <div className={`flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-plum/10 bg-white/60 p-5 text-center shadow-glass ${className}`}>
      <p className="max-w-xs text-xs text-plum-soft">
        El mapa lo ofrece Google Maps. Al cargarlo, Google recibe tu dirección IP y puede guardar cookies en tu navegador.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setCargar(true)} className="rounded-full bg-plum px-5 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark">
          Ver el mapa
        </button>
        {enlace && (
          <a href={enlace} target="_blank" rel="noopener noreferrer" className="rounded-full border border-plum/30 px-5 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5">
            Abrir en Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
