import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function QuienesSomos() {
  return (
    <PaginaInfo
      titulo="Quienes Somos"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">Anita New Style</strong> somos una tienda de moda peruana con pasión por el estilo y la calidad.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Nuestra historia</h3>
              <p className="mt-1 text-sm text-plum-soft">Nacimos en Huancayo con el sueño de ofrecer moda peruana de calidad, seleccionando cada prenda con dedicación y amor por el detalle.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Nuestra misión</h3>
              <p className="mt-1 text-sm text-plum-soft">Brindar a la mujer contemporánea piezas únicas que reflejen su personalidad, con la confianza de una tienda que cuida cada detalle.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Nuestra visión</h3>
              <p className="mt-1 text-sm text-plum-soft">Ser la tienda de moda peruana de referencia, reconocida por su calidad, estilo y cercanía con el cliente en todo el Perú.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Nuestros valores</h3>
              <p className="mt-1 text-sm text-plum-soft">Calidad, honestidad, calidez y pasión por la moda. Cada prenda que elegimos cuenta una historia de esfuerzo y dedicación.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-plum/5 p-5 border border-plum/10">
            <p className="text-sm font-medium text-plum">📍 Tienda física</p>
            <p className="text-sm text-plum-soft">Av. Ejemplo #123, Huancayo. Lunes a sábado de 10am a 8pm.</p>
          </div>
        </div>
      }
    />
  );
}