import React from "react";
import CuentaLayout from "../components/CuentaLayout.jsx";
import { IconWhatsApp, IconMail } from "../components/Icons.jsx";

export default function Ayuda() {
  return (
    <CuentaLayout>
      <div className="glass space-y-5 rounded-3xl p-6 shadow-glass sm:p-8">
        <h2 className="text-xl font-semibold text-plum">¿Necesitas ayuda?</h2>
        <p className="text-sm text-plum-soft">
          Si tienes dudas sobre un pedido, un pago o tu cuenta, puedes escribirnos por estos medios.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#"
            className="flex flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white"
          >
            <IconWhatsApp size={18} className="text-berry" />
            Escribir por WhatsApp
          </a>
          <a
            href="#"
            className="flex flex-1 items-center gap-3 rounded-2xl bg-white/70 px-4 py-3.5 text-sm font-medium text-plum shadow-glass transition hover:bg-white"
          >
            <IconMail size={18} className="text-berry" />
            Escribir un correo
          </a>
        </div>
      </div>
    </CuentaLayout>
  );
}
