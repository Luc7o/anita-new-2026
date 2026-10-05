// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { IconFacebook, IconInstagram, IconWhatsApp } from "./Icons.jsx";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-plum/10 bg-gradient-to-b from-transparent to-plum/5">
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* Grid principal: 4 columnas en desktop, 2 en tablet, 1 en móvil */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ============ COLUMNA 1: ATENCIÓN AL CLIENTE ============ */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-5">
              Atención al Cliente
            </h4>
            <ul className="space-y-3 text-sm text-plum-soft">
              <li>
                <Link to="/formas-de-pago" className="hover:text-berry transition duration-200">
                  Formas de Pago
                </Link>
              </li>
              <li>
                <Link to="/metodos-de-envio" className="hover:text-berry transition duration-200">
                  Métodos de Envío
                </Link>
              </li>
              <li>
                <Link to="/cambios-devoluciones" className="hover:text-berry transition duration-200">
                  Cambios & Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/guia-de-tallas" className="hover:text-berry transition duration-200">
                  Guía de Tallas
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-berry transition duration-200">
                  Preguntas Frecuentes (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-berry transition duration-200">
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* ============ COLUMNA 2: NOSOTROS ============ */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-5">
              Nosotros
            </h4>
            <ul className="space-y-3 text-sm text-plum-soft">
              <li>
                <Link to="/quienes-somos" className="hover:text-berry transition duration-200">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-berry transition duration-200">
                  Reviews de Clientes
                </Link>
              </li>
              <li>
                <Link to="/tiendas" className="hover:text-berry transition duration-200">
                  Nuestras Tiendas
                </Link>
              </li>
              <li>
                <Link to="/trabaja-con-nosotros" className="hover:text-berry transition duration-200">
                  Trabaja con Nosotros
                </Link>
              </li>
            </ul>
          </div>

          {/* ============ COLUMNA 3: ANITA NEW STYLE ============ */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-5">
              Anita New Style
            </h4>
            <p className="text-sm text-plum-soft leading-relaxed">
              Tienda de moda peruana con tienda física en Huancayo. Envíos a todo el Perú.
            </p>

            {/* Redes sociales */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-plum-soft/70 mb-3">
                Conéctate con nosotros
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/anitanewstyle"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-plum-soft shadow-glass transition hover:bg-berry hover:text-white"
                >
                  <IconFacebook size={16} />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-plum-soft shadow-glass transition hover:bg-berry hover:text-white"
                >
                  <IconInstagram size={16} />
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-plum-soft shadow-glass transition hover:bg-berry hover:text-white"
                >
                  <IconWhatsApp size={16} />
                </a>
              </div>
              <p className="mt-3 text-xs text-plum-soft">
                WhatsApp: +51 987 654 321
              </p>
            </div>
          </div>

          {/* ============ COLUMNA 4: VISÍTANOS ============ */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-5">
              Visítanos
            </h4>
            <ul className="space-y-3 text-sm text-plum-soft">
              <li>Jr. Cajamarca 214, Huancayo</li>
              <li>+51 987 654 321</li>
              <li>contacto@anitanewstyle.com</li>
              <li>Lun a Sáb: 10am - 8pm</li>
            </ul>

            {/* Libro de Reclamaciones */}
            <div className="mt-5 pt-5 border-t border-plum/10">
              <Link
                to="/libro-reclamaciones"
                className="text-xs font-semibold text-berry hover:underline"
              >
                Libro de Reclamaciones
              </Link>
            </div>
          </div>

        </div>

        {/* ============ LÍNEA DIVISORIA Y COPYRIGHT ============ */}
        <div className="mt-12 pt-6 border-t border-plum/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-plum-soft/70">
          <p>
            © {new Date().getFullYear()} Anita New Style. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/terminos" className="hover:text-berry transition duration-200">
              Términos y Condiciones
            </Link>
            <span className="text-plum/20">•</span>
            <Link to="/privacidad" className="hover:text-berry transition duration-200">
              Política de Privacidad
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}