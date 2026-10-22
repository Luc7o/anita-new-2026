import React from "react";
import { Link } from "react-router-dom";
import PaginaInfo from "./PaginaInfo.jsx";
import DatosProveedor from "../components/DatosProveedor.jsx";
import useConfigTienda from "../hooks/useConfigTienda.js";
import SeccionLegal from "../components/SeccionLegal.jsx";

const enlace = "font-semibold text-berry hover:underline";

export default function TerminosCondiciones() {
  const config = useConfigTienda();
  return (
    <PaginaInfo
      titulo="Términos y condiciones"
      contenido={
        <div className="space-y-6 text-sm leading-relaxed">
          <p className="text-xs">Última actualización: octubre de 2026</p>

          <p>
            Al usar esta tienda en línea y hacer compras en ella aceptas estos términos. Si no estás de acuerdo con
            alguno, te pedimos que no uses el sitio.
          </p>

          <SeccionLegal titulo="1. Quiénes somos">
            <DatosProveedor />
            <p>
              Contacto:{" "}
              {config.correo_contacto ? (
                <strong className="text-plum">{config.correo_contacto}</strong>
              ) : (
                <Link to="/contacto" className="font-semibold text-berry hover:underline">página de Contacto</Link>
              )}
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="2. Tu cuenta">
            <p>
              Puedes comprar con una cuenta o como invitada o invitado. Eres responsable de mantener la
              confidencialidad de tu contraseña y de la actividad de tu cuenta, y de que los datos que nos des sean
              verdaderos. Puedes registrarte con tu correo o con tu cuenta de Google.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="3. Productos, precios y stock">
            <p>
              Los precios se muestran en soles (S/) e incluyen los impuestos que correspondan. Las fotos son
              referenciales y los colores pueden variar levemente según tu pantalla. El stock está sujeto a
              disponibilidad: si un producto se agota antes de confirmar tu pedido, te lo informaremos y podrás
              elegir otra opción o recibir el reembolso de lo pagado.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="4. Cómo se realiza una compra">
            <p>
              Eliges tus productos, ingresas tus datos de envío y pagas con alguno de los medios habilitados al
              finalizar la compra. Tu pedido queda confirmado cuando se verifica el pago, y te lo avisamos por
              correo. Si el pago no se completa dentro del plazo indicado en tu pedido, este puede cancelarse
              automáticamente y el stock se libera.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="5. Medios de pago">
            <p>
              Aceptamos los medios de pago que veas disponibles en el checkout (por ejemplo tarjeta y Yape). Los
              pagos con tarjeta y Yape se procesan a través de Culqi; nosotros no almacenamos los datos de tu
              tarjeta. Más información en <Link to="/formas-de-pago" className={enlace}>Formas de pago</Link>.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="6. Envíos y entregas">
            <p>
              Los costos, zonas y plazos de entrega se detallan en <Link to="/metodos-de-envio" className={enlace}>Métodos de envío</Link>.
              Los plazos son estimados y pueden variar por causas ajenas a nosotros, como el transporte o las
              condiciones climáticas.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="7. Cambios, devoluciones y reembolsos">
            <p>
              Las condiciones para cambios y devoluciones están en <Link to="/cambios-devoluciones" className={enlace}>Cambios y devoluciones</Link>.
              Lo dispuesto allí se entiende sin perjuicio de los derechos que la ley te reconoce como consumidor.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="8. Libro de Reclamaciones">
            <p>
              Si tienes un reclamo o una queja, puedes registrarlo en nuestro{" "}
              <Link to="/libro-reclamaciones" className={enlace}>Libro de Reclamaciones virtual</Link>. Te
              responderemos en un plazo máximo de 15 días hábiles. Presentar un reclamo no impide que acudas al
              INDECOPI u otras vías de solución de controversias.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="9. Uso adecuado del sitio">
            <p>
              No está permitido usar el sitio para actividades ilegales, intentar acceder sin autorización a
              cuentas o sistemas, interferir con su funcionamiento ni usar medios automatizados para extraer su
              contenido.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="10. Propiedad intelectual">
            <p>
              El nombre, el logo, las fotografías, los textos y el diseño de la tienda pertenecen a Anita New Style
              o se usan con autorización. No puedes copiarlos ni reutilizarlos sin permiso por escrito.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="11. Responsabilidad">
            <p>
              Hacemos lo posible por que la información del sitio sea correcta y por que este funcione sin
              interrupciones, pero no garantizamos que esté libre de errores o disponible en todo momento. Nada en
              estos términos limita los derechos que la ley te reconoce como consumidor.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="12. Datos personales">
            <p>
              Tratamos tus datos según nuestra{" "}
              <Link to="/politica-de-privacidad" className={enlace}>Política de privacidad</Link>.
            </p>
          </SeccionLegal>

          <SeccionLegal titulo="13. Cambios y ley aplicable">
            <p>
              Podemos actualizar estos términos; la versión vigente es siempre la publicada en esta página. Se rigen
              por las leyes de la República del Perú, en particular el Código de Protección y Defensa del
              Consumidor (Ley N.º 29571).
            </p>
          </SeccionLegal>
        </div>
      }
    />
  );
}
