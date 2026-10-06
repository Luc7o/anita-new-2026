import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function NuestrasTiendas() {
  return (
    <PaginaInfo
      titulo="Nuestras Tiendas"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Actualmente tenemos una tienda física y estamos creciendo para llegar a más ciudades del Perú.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">📍 Huancayo (Tienda principal)</h3>
              <p className="mt-1 text-sm text-plum-soft">Av. Ejemplo #123, Huancayo</p>
              <p className="text-sm text-plum-soft">Horario: Lunes a Sábado de 10am a 8pm</p>
              <p className="text-sm text-plum-soft">Teléfono: (064) 123-456</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">🚀 Próximamente</h3>
              <p className="mt-1 text-sm text-plum-soft">Estamos trabajando para abrir nuevas tiendas en Lima y Arequipa en los próximos meses.</p>
              <p className="text-sm text-plum-soft">Síguenos en redes para más novedades.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📞 ¿Dudas sobre nuestras tiendas?</p>
            <p className="text-sm text-plum-soft">Escríbenos a <strong>contacto@anitanewstyle.com</strong> o llámanos al (064) 123-456.</p>
          </div>
        </div>
      }
    />
  );
}