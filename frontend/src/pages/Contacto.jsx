import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function Contacto() {
  return (
    <PaginaInfo
      titulo="Contáctanos"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Estamos aquí para ayudarte. Elige el medio que prefieras y cuéntanos cómo podemos ayudarte.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Correo electrónico</h3>
              <p className="mt-1 text-sm text-plum-soft">contacto@anitanewstyle.com</p>
              <p className="text-xs text-plum-soft/70">Respondemos en menos de 24 horas.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">WhatsApp</h3>
              <p className="mt-1 text-sm text-plum-soft">+51 987 654 321</p>
              <p className="text-xs text-plum-soft/70">Lunes a sábado, 10am - 8pm.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Tienda física</h3>
              <p className="mt-1 text-sm text-plum-soft">Av. Ejemplo #123, Huancayo</p>
              <p className="text-xs text-plum-soft/70">Lunes a sábado, 10am - 8pm.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Teléfono fijo</h3>
              <p className="mt-1 text-sm text-plum-soft">(064) 123-456</p>
              <p className="text-xs text-plum-soft/70">Lunes a viernes, 9am - 6pm.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📬 Horario de atención</p>
            <p className="text-sm text-plum-soft">Lunes a sábado de 10:00 a.m. a 8:00 p.m. Domingos y feriados cerrado.</p>
          </div>
        </div>
      }
    />
  );
}
