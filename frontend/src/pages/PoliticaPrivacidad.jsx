import React from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import DatosProveedor from "../components/DatosProveedor.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";
import SeccionLegal from "../components/SeccionLegal.jsx";
import { FECHA_ACTUALIZACION_LEGAL, VERSION_TERMINOS } from "../legal.js";
import { useMetadatos } from "../hooks/useMetadatos";

// El correo sale de la configuración de la tienda (panel admin). Si todavía no
// hay correo cargado, se manda a la página de Contacto en vez de publicar uno inventado.
function Contactar() {
  const { correo_contacto } = useConfigTienda();
  return correo_contacto ? (
    <>escríbenos a <strong className="text-plum">{correo_contacto}</strong></>
  ) : (
    <>escríbenos desde nuestra página de <Link to="/contacto" className="font-semibold text-berry hover:underline">Contacto</Link></>
  );
}

export default function PoliticaPrivacidad() {
  useMetadatos({ titulo: "Política de privacidad" });
  return (
    <PaginaInfo
      titulo="Política de privacidad"
      contenido={
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-xs">Última actualización: {FECHA_ACTUALIZACION_LEGAL} (versión {VERSION_TERMINOS})</p>

          <p>
            En Anita New Style respetamos tu privacidad. Esta política explica qué datos personales recopilamos
            cuando usas nuestra tienda en línea, para qué los usamos, con quién los compartimos y cómo puedes
            ejercer tus derechos, de acuerdo con la Ley N.º 29733, Ley de Protección de Datos Personales, y su
            Reglamento.
          </p>

          <SeccionLegal titulo="1. Quién es el responsable de tus datos">
            <DatosProveedor />
            <p>Para consultas sobre tus datos, <Contactar />.</p>
          </SeccionLegal>

          <SeccionLegal titulo="2. Qué datos recopilamos">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Tu cuenta:</strong> nombre, apellido, correo electrónico y contraseña (la guardamos cifrada, nunca en texto legible).</li>
              <li><strong className="text-plum">Tus compras y envíos:</strong> documento de identidad (DNI o RUC, según el comprobante), teléfono, dirección y distrito de entrega, y el detalle de tus pedidos.</li>
              <li><strong className="text-plum">Inicio de sesión con Google:</strong> si eliges esta opción, recibimos tu nombre, apellido, correo electrónico y un identificador de tu cuenta de Google. No recibimos tu contraseña de Google ni accedemos a tus contactos, correos u otros datos de tu cuenta.</li>
              <li><strong className="text-plum">Libro de Reclamaciones:</strong> los datos que ingresas en tu hoja de reclamación (identificación, domicilio, contacto y detalle del reclamo).</li>
              <li><strong className="text-plum">Estadísticas de uso (opcional):</strong> solo si las aceptas en el aviso de privacidad. Ver la sección 3.</li>
              <li>
                <strong className="text-plum">Almacenamiento estrictamente necesario (siempre activo):</strong> una cookie de seguridad
                para mantener tu sesión y protegerla, tu carrito guardado en el navegador, claves temporales para evitar cobros o pedidos
                duplicados, esta misma elección de privacidad y, si marcas «Recordarme» al ingresar, tu correo. Sin esto la tienda no
                puede funcionar y no se usa para medirte ni para publicidad.
              </li>
              <li><strong className="text-plum">Aceptación de estos textos:</strong> al crear tu cuenta guardamos la fecha y la versión de los Términos y de esta Política que aceptaste.</li>
            </ul>
          </SeccionLegal>

          <SeccionLegal titulo="3. Estadísticas de uso (solo con tu permiso)">
            <p>
              Al entrar por primera vez te preguntamos si aceptas que midamos el uso de la tienda. <strong className="text-plum">Nada de esto
              se activa por defecto</strong> y la tienda (tu cuenta, el carrito, los pedidos y los pagos) funciona igual si lo rechazas.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Qué recopilamos si aceptas:</strong> un identificador aleatorio guardado en tu navegador y las
                acciones que haces en la tienda: las páginas que visitas (solo la ruta, sin lo que escribas), los productos que ves, los que
                agregas al carrito y cuándo inicias y completas una compra. Si tienes la sesión iniciada, esos registros se asocian a tu cuenta.</li>
              <li><strong className="text-plum">Para qué:</strong> saber qué productos y páginas funcionan y dónde se abandona la compra, para
                mejorar la tienda. No los usamos para publicidad ni los compartimos con otras empresas.</li>
              <li><strong className="text-plum">Cuánto tiempo:</strong> 180 días; después se borran automáticamente. Dejamos constancia de tu decisión,
                su fecha y la versión del aviso que viste. Si rechazas, no se crea ningún identificador y no se guarda nada que te identifique.
                Tu elección se te vuelve a preguntar a los 12 meses o si cambia lo que medimos.</li>
              <li><strong className="text-plum">Cómo cambiar o retirar tu consentimiento:</strong> en cualquier momento, desde «Preferencias de
                privacidad» en el pie de página de la tienda, o en Mi cuenta &gt; Configuración. Al retirarlo dejamos de medirte de inmediato,
                borramos el identificador de tu navegador y eliminamos el historial de estadísticas asociado a ese identificador y, si tienes la
                sesión iniciada, a tu cuenta. La elección se guarda en cada navegador: si usas otro dispositivo, se te preguntará allí.</li>
            </ul>
          </SeccionLegal>

          <SeccionLegal titulo="4. Para qué usamos tus datos">
            <ul className="list-disc space-y-1 pl-5">
              <li>Crear y administrar tu cuenta.</li>
              <li>Procesar tus pedidos, pagos y envíos, y emitir tus comprobantes.</li>
              <li>Atenderte: responder consultas, cambios, devoluciones y reclamos.</li>
              <li>Enviarte correos relacionados con tu cuenta y tus pedidos (confirmaciones, estados, recuperación de contraseña).</li>
              <li>Enviarte promociones por correo <strong className="text-plum">solo si tú lo activas</strong>. Está desactivado por defecto y puedes cambiarlo cuando quieras en Mi cuenta &gt; Configuración.</li>
              <li>Proteger la tienda y tu cuenta frente a fraudes y accesos no autorizados.</li>
              <li>Mejorar la tienda con estadísticas de uso, solo si las aceptas (ver sección 3).</li>
            </ul>
            <p>No vendemos tus datos personales ni los usamos para entrenar sistemas de inteligencia artificial.</p>
          </SeccionLegal>

          <SeccionLegal titulo="5. Con quién los compartimos">
            <p>Solo compartimos los datos necesarios con proveedores que nos ayudan a operar la tienda:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Culqi:</strong> procesa los pagos con tarjeta y Yape. Los datos de tu tarjeta los recibe Culqi directamente y nosotros no los almacenamos.</li>
              <li><strong className="text-plum">Resend:</strong> envío de correos electrónicos (confirmaciones, avisos de pedido y recuperación de contraseña).</li>
              <li><strong className="text-plum">Vercel:</strong> alojamiento de la tienda y almacenamiento de las imágenes de los productos.</li>
              <li><strong className="text-plum">Neon:</strong> base de datos donde se guarda la información de tu cuenta y de tus pedidos.</li>
              <li><strong className="text-plum">Upstash:</strong> memoria temporal para limitar intentos repetidos de acceso y acelerar la carga del catálogo.</li>
              <li><strong className="text-plum">Google:</strong> si eliges iniciar sesión con tu cuenta de Google (en esa pantalla se carga un script de Google), y para mostrar el mapa de nuestras tiendas, que solo se carga si pulsas «Ver el mapa». Al cargarlo, Google recibe tu IP y puede guardar sus cookies.</li>
              <li><strong className="text-plum">API Perú:</strong> consulta del número de DNI o RUC para comprobar que es válido cuando lo necesitamos.</li>
              <li><strong className="text-plum">Empresas de transporte:</strong> para entregar tu pedido, con los datos de contacto y dirección necesarios.</li>
            </ul>
            <p>También podemos entregar datos cuando una autoridad competente lo exija conforme a ley.</p>
            <p>
              El uso que hacemos de la información recibida de Google se ajusta a la Política de datos de usuario de
              los servicios de API de Google, incluidos los requisitos de uso limitado.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="6. Cuánto tiempo los conservamos">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Tu cuenta:</strong> mientras la mantengas. Si la eliminas, anonimizamos los datos personales de la cuenta (nombre, correo, teléfono, documento, dirección y acceso).</li>
              <li><strong className="text-plum">Tus pedidos y comprobantes:</strong> se conservan, aunque elimines la cuenta, con sus datos de entrega y de comprobante, durante el tiempo que exijan las normas tributarias y de protección al consumidor, y mientras sean necesarios para atender cambios, devoluciones y reclamos.</li>
              <li><strong className="text-plum">Libro de Reclamaciones:</strong> durante el plazo que establece la normativa de protección al consumidor.</li>
              <li><strong className="text-plum">Estadísticas de uso (si las aceptaste):</strong> 180 días. El registro de tu decisión con su identificador se elimina a los 13 meses si no la renuevas.</li>
              <li><strong className="text-plum">Enlaces de recuperación de contraseña:</strong> expiran por sí solos y los eliminamos a los 7 días.</li>
              <li><strong className="text-plum">Registros técnicos de rendimiento del sitio</strong> (sin datos personales): 30 días.</li>
            </ul>
          </SeccionLegal>

          <SeccionLegal titulo="7. Cómo protegemos tus datos">
            <p>
              Tu conexión con la tienda va cifrada (HTTPS), las contraseñas se guardan cifradas y el acceso a la
              información interna está limitado según el rol de cada persona del equipo. Ningún sistema es
              infalible, pero trabajamos para mantener tus datos protegidos.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="8. Tus derechos">
            <p>
              Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición sobre tus datos personales.
              Si tienes cuenta, puedes hacerlo tú mismo en Mi cuenta:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-plum">Ver y corregir:</strong> en Perfil puedes revisar y actualizar tus datos.</li>
              <li><strong className="text-plum">Descargar:</strong> en Configuración, «Descargar mis datos» te entrega una copia en formato JSON.</li>
              <li><strong className="text-plum">Eliminar:</strong> en Configuración puedes eliminar tu cuenta (si no tienes pedidos en curso).</li>
              <li><strong className="text-plum">Estadísticas de uso:</strong> en el pie de página, «Preferencias de privacidad» (o en Configuración), puedes retirar tu consentimiento cuando quieras.</li>
              <li><strong className="text-plum">Promociones:</strong> en Configuración activas o desactivas los correos de promociones.</li>
            </ul>
            <p>
              Para cualquier otra solicitud, <Contactar />, indicando tu nombre, el correo de tu cuenta y qué quieres hacer.
              Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="9. Menores de edad">
            <p>La tienda no está dirigida a menores de 18 años. Si eres menor de edad, usa la tienda con el permiso de tu padre, madre o apoderado.</p>
          </SeccionLegal>

          <SeccionLegal titulo="10. Cambios en esta política">
            <p>
              Podemos actualizar esta política. Publicaremos siempre la versión vigente en esta página, con su
              fecha de actualización.
            </p>
          </SeccionLegal>

          <p>
            Consulta también nuestros <Link to="/terminos-y-condiciones" className="font-semibold text-berry hover:underline">Términos y condiciones</Link>.
          </p>
        </div>
      }
    />
  );
}
