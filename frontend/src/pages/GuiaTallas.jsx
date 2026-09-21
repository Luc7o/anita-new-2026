import React from "react";
import PaginaInfo from "./PaginaInfo.jsx";

export default function GuiaTallas() {
  return (
    <PaginaInfo
      titulo="Guía de Tallas"
      volver="/tienda"
      contenido={
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">
            Encuentra tu talla perfecta con nuestra guía. Las medidas son orientativas y pueden variar ligeramente según el diseño de cada prenda.
          </p>

          <div className="overflow-x-auto rounded-xl border border-plum/10">
            <table className="w-full text-sm">
              <thead className="bg-plum/10">
                <tr>
                  <th className="border border-plum/20 px-4 py-3 text-left font-semibold text-plum">Talla</th>
                  <th className="border border-plum/20 px-4 py-3 text-left font-semibold text-plum">Pecho (cm)</th>
                  <th className="border border-plum/20 px-4 py-3 text-left font-semibold text-plum">Cintura (cm)</th>
                  <th className="border border-plum/20 px-4 py-3 text-left font-semibold text-plum">Cadera (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-plum/20 px-4 py-2">XS</td><td className="border border-plum/20 px-4 py-2">80-84</td><td className="border border-plum/20 px-4 py-2">60-64</td><td className="border border-plum/20 px-4 py-2">86-90</td></tr>
                <tr className="bg-white/30"><td className="border border-plum/20 px-4 py-2">S</td><td className="border border-plum/20 px-4 py-2">85-89</td><td className="border border-plum/20 px-4 py-2">65-69</td><td className="border border-plum/20 px-4 py-2">91-95</td></tr>
                <tr><td className="border border-plum/20 px-4 py-2">M</td><td className="border border-plum/20 px-4 py-2">90-94</td><td className="border border-plum/20 px-4 py-2">70-74</td><td className="border border-plum/20 px-4 py-2">96-100</td></tr>
                <tr className="bg-white/30"><td className="border border-plum/20 px-4 py-2">L</td><td className="border border-plum/20 px-4 py-2">95-99</td><td className="border border-plum/20 px-4 py-2">75-79</td><td className="border border-plum/20 px-4 py-2">101-105</td></tr>
                <tr><td className="border border-plum/20 px-4 py-2">XL</td><td className="border border-plum/20 px-4 py-2">100-104</td><td className="border border-plum/20 px-4 py-2">80-84</td><td className="border border-plum/20 px-4 py-2">106-110</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-plum-soft/70">* Para zapatos y accesorios, consulta las medidas específicas en la descripción del producto.</p>
        </div>
      }
    />
  );
}