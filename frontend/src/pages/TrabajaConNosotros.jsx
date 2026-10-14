import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";
import BotonesContacto from "../components/BotonesContacto.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";

export default function TrabajaConNosotros() {
  const c = useConfigTienda();
  return (
    <PaginaInfo
      titulo="Trabaja con nosotros"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">{c.nombre_comercial}</strong> estamos siempre buscando personas apasionadas por la moda y el servicio al cliente.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">¿Qué buscamos?</h3>
              <ul className="mt-2 space-y-1 text-sm text-plum-soft list-disc pl-4">
                <li>Pasión por la moda y la atención al cliente.</li>
                <li>Proactividad y trabajo en equipo.</li>
                <li>Disponibilidad para trabajar en Huancayo.</li>
                <li>Ganas de aprender y crecer con nosotros.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Posiciones disponibles</h3>
              <ul className="mt-2 space-y-1 text-sm text-plum-soft list-disc pl-4">
                <li>Vendedor(a) de tienda.</li>
                <li>Asistente de redes sociales.</li>
                <li>Asistente de logística y envíos.</li>
                <li>Prácticas profesionales (marketing, administración).</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📩 ¿Cómo postular?</p>
            <p className="mb-3 text-sm text-plum-soft">Escríbenos indicando el puesto al que postulas y cuéntanos por qué te gustaría trabajar con nosotros.</p>
            <BotonesContacto
              mensaje="Hola, quiero postular a un puesto. Puesto: "
              asunto="Postulación - [Nombre del puesto]"
            />
          </div>
        </div>
      }
    />
  );
}