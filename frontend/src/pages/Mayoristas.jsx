import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function Mayoristas() {
  return (
    <PaginaInfo
      titulo="Ventas Mayoristas"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Si tienes una tienda o negocio y deseas adquirir nuestros productos al por mayor, estamos listos para trabajar contigo.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">¿Qué ofrecemos?</h3>
              <ul className="mt-2 space-y-1 text-sm text-plum-soft list-disc pl-4">
                <li>Precios especiales para pedidos al por mayor.</li>
                <li>Catálogo exclusivo para mayoristas.</li>
                <li>Condiciones de pago flexibles.</li>
                <li>Asesoría personalizada para tu negocio.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Requisitos</h3>
              <ul className="mt-2 space-y-1 text-sm text-plum-soft list-disc pl-4">
                <li>RUC activo y documento de identidad.</li>
                <li>Pedido mínimo de S/ 500 (aplica para todo el Perú).</li>
                <li>Número de contacto y correo para coordinación.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📩 ¿Cómo empezar?</p>
            <p className="text-sm text-plum-soft">Escríbenos a <strong>mayoristas@anitanewstyle.com</strong> o por WhatsApp al +51 987 654 321. Te responderemos en menos de 24 horas.</p>
          </div>
        </div>
      }
    />
  );
}