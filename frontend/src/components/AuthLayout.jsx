import React from "react";
import { Link } from "react-router-dom";
import RedesAuth from "./RedesAuth.jsx";
import { IconArrowLeft } from "./Icons.jsx";

// Las clases de Tailwind van completas (no armadas con template strings) para que
// el compilador las detecte.
const ALTO_MARCA = { 280: "min-h-[280px]", 320: "min-h-[320px]" };
const PADDING_FORM = { 12: "py-12", 16: "py-16" };
const ANCHO_FORM = { 420: "max-w-[420px]", 460: "max-w-[460px]" };

// Maqueta de las pantallas de acceso (ingresar, registro, recuperar y restablecer
// contraseña): columna de marca con foto a un lado y el formulario al otro.
//
// Props:
//   imagen / posicionImagen: foto de fondo de la columna de marca
//   titulo: contenido del <h1> (puede llevar <br />)
//   marca: texto o lista que va debajo del título (un <p> o <div> ya armado)
//   conAtras: muestra la flecha para volver a la tienda
//   altoMarca (280 | 320), anchoForm (420 | 460), padY (12 | 16): medidas de la maqueta
//   children: el contenido del formulario
export default function AuthLayout({
  imagen,
  posicionImagen,
  titulo,
  marca,
  conAtras = false,
  altoMarca = 320,
  anchoForm = 420,
  padY = 16,
  children,
}) {
  const fondo = { backgroundImage: `url(${imagen})` };
  if (posicionImagen) fondo.backgroundPosition = posicionImagen;

  return (
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {conAtras && (
        <Link
          to="/"
          aria-label="Volver al inicio"
          className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-plum shadow-glass backdrop-blur transition hover:bg-white hover:text-berry sm:left-6 sm:top-6 group"
          title="Regresar a la tienda"
        >
          <IconArrowLeft size={18} />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-plum/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
            Regresar a la tienda
          </span>
        </Link>
      )}

      {/* Columna de marca */}
      <div
        className={`relative flex ${ALTO_MARCA[altoMarca]} flex-col justify-end gap-6 overflow-hidden bg-cover ${
          posicionImagen ? "" : "bg-center"
        } p-6 sm:p-10 lg:w-1/2`}
        style={fondo}
      >
        <div className="absolute inset-0 bg-plum/25" />
        <div className="glass relative z-10 rounded-2xl p-6 sm:p-8">
          <h1 className="text-4xl font-semibold leading-tight text-plum sm:text-5xl">{titulo}</h1>
          {marca}
          <div className="mt-6 flex items-center gap-4">
            <RedesAuth />
          </div>
        </div>
      </div>

      {/* Columna de formulario */}
      <div
        className={`flex flex-1 flex-col items-center justify-center bg-white px-6 ${PADDING_FORM[padY]} sm:px-16 lg:w-1/2`}
      >
        <div className={`w-full ${ANCHO_FORM[anchoForm]}`}>{children}</div>
      </div>
    </div>
  );
}
