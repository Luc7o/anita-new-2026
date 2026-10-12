import React from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import DatosProveedor from "../components/DatosProveedor.jsx";
import { EMPRESA } from "../datosEmpresa.js";

// El correo sale de datosEmpresa.js (un solo lugar). Si todavía no hay correo
// cargado, se manda a la página de Contacto en vez de publicar uno inventado.
function Contactar() {
  return EMPRESA.correoContacto ? (
    <>escríbenos a <strong className="text-plum">{EMPRESA.correoContacto}</strong></>
  ) : (
    <>escríbenos desde nuestra página de <Link to="/contacto" className="font-semibold text-berry hover:underline">Contacto</Link></>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-plum">{titulo}</h2>
      {children}
    </section>
  );
}

export default function PoliticaPrivacidad() {
  return (
    <PaginaInfo
      titulo="Política de privacidad"
      contenido={
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-xs">Última actualización: octubre de 2026</p>

          <p>
            En Anita New Style respetamos tu privacidad. Esta política explica qué datos personales recopilamos
            cuando usas nuestra tienda en línea, para qué los usamos, con quién los compartimos y cómo puedes
            ejercer tus derechos, de acuerdo con la Ley N.º 29733, Ley de Protección de Datos Personales, y su
            Reglamento.
          </p>

          <Seccion titulo="1. Quién es el responsable de tus datos">
            <DatosProveedor />
            <p>Para consultas sobre tus datos, <Contactar />.</p>
          </Seccion>

          <Seccion titulo="2. Qué datos recopilamos">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Tu cuenta:</strong> nombre, apellido, correo electrónico y contraseña (la guardamos cifrada, nunca en texto legible).</li>
              <li><strong className="text-plum">Tus compras y envíos:</strong> documento de identidad (DNI o RUC, según el comprobante), teléfono, dirección y distrito de entrega, y el detalle de tus pedidos.</li>
              <li><strong className="text-plum">Inicio de sesión con Google:</strong> si eliges esta opción, recibimos tu nombre, apellido, correo electrónico y un identificador de tu cuenta de Google. No recibimos tu contraseña de Google ni accedemos a tus contactos, correos u otros datos de tu cuenta.</li>
              <li><strong className="text-plum">Libro de Reclamaciones:</strong> los datos que ingresas en tu hoja de reclamación (identificación, domicilio, contacto y detalle del reclamo).</li>
              <li><strong className="text-plum">Uso del sitio:</strong> información básica de navegación, como páginas y productos vistos o acciones en el carrito, para entender cómo se usa la tienda y mejorarla.</li>
              <li><strong className="text-plum">Cookies y almacenamiento del navegador:</strong> usamos una cookie de sesión y almacenamiento local, solo con fines técnicos y de seguridad, para mantener tu sesión iniciada y protegerla.</li>
            </ul>
          </Seccion>

          <Seccion titulo="3. Para qué usamos tus datos">
            <ul className="list-disc space-y-1 pl-5">
              <li>Crear y administrar tu cuenta.</li>
              <li>Procesar tus pedidos, pagos y envíos, y emitir tus comprobantes.</li>
              <li>Atenderte: responder consultas, cambios, devoluciones y reclamos.</li>
              <li>Enviarte correos relacionados con tu cuenta y tus pedidos (confirmaciones, estados, recuperación de contraseña).</li>
              <li>Proteger la tienda y tu cuenta frente a fraudes y accesos no autorizados.</li>
              <li>Mejorar la tienda con estadísticas de uso.</li>
            </ul>
            <p>No vendemos tus datos personales.</p>
          </Seccion>

          <Seccion titulo="4. Con quién los compartimos">
            <p>Solo compartimos los datos necesarios con proveedores que nos ayudan a operar la tienda:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Culqi:</strong> procesa los pagos con tarjeta y Yape. Los datos de tu tarjeta los recibe Culqi directamente y nosotros no los almacenamos.</li>
              <li><strong className="text-plum">Resend:</strong> envío de correos electrónicos.</li>
              <li><strong className="text-plum">Vercel y Railway:</strong> alojamiento de la tienda y de la base de datos.</li>
              <li><strong className="text-plum">Google:</strong> solo si eliges iniciar sesión con tu cuenta de Google.</li>
              <li><strong className="text-plum">Servicios de validación de documentos:</strong> para comprobar el número de DNI o RUC cuando lo necesitamos.</li>
              <li><strong className="text-plum">Empresas de transporte:</strong> para entregar tu pedido, con los datos de contacto y dirección necesarios.</li>
            </ul>
            <p>También podemos entregar datos cuando una autoridad competente lo exija conforme a ley.</p>
            <p>
              El uso que hacemos de la información recibida de Google se ajusta a la Política de datos de usuario de
              los servicios de API de Google, incluidos los requisitos de uso limitado.
            </p>
          </Seccion>

          <Seccion titulo="5. Cuánto tiempo los conservamos">
            <p>
              Conservamos tus datos mientras tengas una cuenta activa y durante el tiempo necesario para cumplir
              las finalidades descritas y las obligaciones legales, por ejemplo las tributarias y de atención de
              reclamos.
            </p>
          </Seccion>

          <Seccion titulo="6. Cómo protegemos tus datos">
            <p>
              Tu conexión con la tienda va cifrada (HTTPS), las contraseñas se guardan cifradas y el acceso a la
              información interna está limitado según el rol de cada persona del equipo. Ningún sistema es
              infalible, pero trabajamos para mantener tus datos protegidos.
            </p>
          </Seccion>

          <Seccion titulo="7. Tus derechos">
            <p>
              Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición sobre tus datos
              personales: <Contactar />, indicando tu nombre, el correo de tu cuenta y qué quieres hacer. Si consideras que no atendimos tu solicitud,
              puedes acudir a la Autoridad Nacional de Protección de Datos Personales.
            </p>
          </Seccion>

          <Seccion titulo="8. Menores de edad">
            <p>La tienda no está dirigida a menores de 18 años. Si eres menor de edad, usa la tienda con el permiso de tu padre, madre o apoderado.</p>
          </Seccion>

          <Seccion titulo="9. Cambios en esta política">
            <p>
              Podemos actualizar esta política. Publicaremos siempre la versión vigente en esta página, con su
              fecha de actualización.
            </p>
          </Seccion>

          <p>
            Consulta también nuestros <Link to="/terminos-y-condiciones" className="font-semibold text-berry hover:underline">Términos y condiciones</Link>.
          </p>
        </div>
      }
    />
  );
}
