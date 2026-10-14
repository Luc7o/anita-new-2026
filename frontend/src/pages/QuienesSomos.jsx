import React from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";

export default function QuienesSomos() {
  const c = useConfigTienda();
  const ciudad = c.ciudad || "Huancayo";
  return (
    <PaginaInfo
      titulo="Quienes Somos"
      volver="/"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            En <strong className="text-plum">{c.nombre_comercial}</strong> somos una tienda de moda peruana con pasión por el estilo y la calidad.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-sm">
              <h3 className="font-semibold text-plum">Nuestra historia</h3>
              <p className="mt-1 text-sm text-plum-soft">Nacimos en {ciudad} con el sueño de ofrecer moda peruana de calidad, seleccionando cada prenda con dedicación y amor por el detalle.</p>
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
            <p className="text-sm font-medium text-plum">Tienda física</p>
            {c.direccion || c.horario_atencion ? (
              <>
                {c.direccion && (
                  <p className="text-sm text-plum-soft">
                    {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ""}.
                    {c.referencia ? ` ${c.referencia}.` : ""}
                  </p>
                )}
                {c.horario_atencion && <p className="text-sm text-plum-soft">{c.horario_atencion}</p>}
              </>
            ) : (
              <p className="text-sm text-plum-soft">Mira dónde encontrarnos en la sección Nuestras tiendas.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/tienda" className="flex flex-1 items-center justify-center rounded-2xl bg-berry px-5 py-3 text-sm font-semibold text-white shadow-glass transition hover:bg-berry-dark">
              Ver la tienda
            </Link>
            <Link to="/tiendas" className="flex flex-1 items-center justify-center rounded-2xl border border-plum/15 bg-white/70 px-5 py-3 text-sm font-medium text-plum shadow-glass transition hover:bg-white">
              Nuestras tiendas
            </Link>
          </div>
        </div>
      }
    />
  );
}