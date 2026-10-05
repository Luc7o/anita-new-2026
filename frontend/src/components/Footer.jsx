// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { IconFacebook, IconInstagram, IconWhatsApp } from "./Icons.jsx";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-plum/10 bg-gradient-to-b from-transparent to-plum/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Grid principal: 4 columnas en desktop, 1 en móvil */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Columna 1: Atención al cliente */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-4">
              Atención al cliente
            </h4>
            <ul className="space-y-2.5 text-sm text-plum-soft">
              <li><Link to="/formas-de-pago" className="hover:text-berry transition duration-200">Formas de pago</Link></li>
              <li><Link to="/metodos-de-envio" className="hover:text-berry transition duration-200">Métodos de Envío</Link></li>
              <li><Link to="/cambios-devoluciones" className="hover:text-berry transition duration-200">Cambios & Devoluciones</Link></li>
              <li><Link to="/guia-de-tallas" className="hover:text-berry transition duration-200">Guía de Tallas</Link></li>
              <li><Link to="/faq" className="hover:text-berry transition duration-200">Preguntas frecuentes (FAQ)</Link></li>
              <li><Link to="/contacto" className="hover:text-berry transition duration-200">Contáctanos</Link></li>
            </ul>
          </div>

          {/* Columna 2: Nosotros */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-4">
              Nosotros
            </h4>
            <ul className="space-y-2.5 text-sm text-plum-soft">
              <li><Link to="/quienes-somos" className="hover:text-berry transition duration-200">Quiénes somos</Link></li>
              <li><Link to="/reviews" className="hover:text-berry transition duration-200">Reviews de clientes</Link></li>
              <li><Link to="/tiendas" className="hover:text-berry transition duration-200">Nuestras Tiendas</Link></li>
              <li><Link to="/trabaja-con-nosotros" className="hover:text-berry transition duration-200">Trabaja con nosotros</Link></li>
            </ul>
          </div>

          {/* Columna 3: Anita New Style (marca) */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-4">
              Anita New Style
            </h4>
            <p className="text-sm text-plum-soft leading-relaxed">
              Tienda de moda peruana con tienda física en Huancayo. Envíos a todo el Perú.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://www.facebook.com/anitanewstyle"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-plum-soft hover:text-berry transition duration-200"
              >
                <IconFacebook />
              </a>
              <a href="#" aria-label="Instagram" className="text-plum-soft hover:text-berry transition duration-200">
                <IconInstagram />
              </a>
              <a href="#" aria-label="WhatsApp" className="text-plum-soft hover:text-berry transition duration-200">
                <IconWhatsApp />
              </a>
            </div>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h4 className="font-display text-lg font-semibold text-plum mb-4">
              Contáctanos
            </h4>
            <ul className="space-y-2.5 text-sm text-plum-soft">
              <li>📍 Jr. Cajamarca 214, Huancayo</li>
              <li>📱 +51 987 654 321</li>
              <li>📧 contacto@anitanewstyle.com</li>
              <li>🕒 Lun a Sáb: 10am - 8pm</li>
            </ul>
          </div>

        </div>

        {/* Línea divisoria y copyright */}
        <div className="mt-12 pt-6 border-t border-plum/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-plum-soft/70">
          <p>© {new Date().getFullYear()} Anita New Style. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/terminos" className="hover:text-berry transition duration-200">Términos y Condiciones</Link>
            <Link to="/privacidad" className="hover:text-berry transition duration-200">Política de Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}