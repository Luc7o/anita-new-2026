// Integración con Culqi Checkout (tarjeta y Yape). Culqi tokeniza los datos
// sensibles directamente en el navegador del cliente — nunca pasan por
// nuestro backend — y nos entrega un token id que mandamos a
// POST /pedidos/:id/pagar para hacer el cobro real (síncrono, sin
// redirección ni webhook, a diferencia de TuPay).
//
// Doc: https://docs.culqi.com/es/documentacion/checkout/checkout-custom

const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY;
const CULQI_SCRIPT_URL = "https://js.culqi.com/checkout-js";

let cargaScript = null;

function cargarScriptCulqi() {
  if (window.CulqiCheckout) return Promise.resolve();
  if (cargaScript) return cargaScript;

  cargaScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CULQI_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el checkout de Culqi"));
    document.body.appendChild(script);
  });
  return cargaScript;
}

// Error con el que se rechaza la promesa cuando el cliente cierra el widget sin pagar.
export const CULQI_CERRADO = "culqi_cerrado";

// Máximo que se espera al widget: lo mismo que dura el plazo de pago del pedido (20 min).
const MS_MAXIMO_WIDGET = 20 * 60 * 1000;
const MS_REVISION = 700;

// La ventana del widget es un iframe de Culqi. Se considera abierta si existe y se ve.
function widgetVisible() {
  const marco = document.querySelector('iframe[src*="culqi"]');
  if (!marco) return false;
  const estilo = window.getComputedStyle(marco);
  return estilo.display !== "none" && estilo.visibility !== "hidden" && marco.offsetParent !== null;
}

/**
 * Abre el widget de Culqi (tarjeta o Yape) por el monto indicado y se
 * resuelve con { tokenId, email } cuando el cliente completa el pago.
 * Se rechaza si Culqi devuelve un error (tarjeta inválida, Yape mal
 * ingresado, etc).
 *
 * Si el cliente cierra el widget con la "X" sin pagar, se rechaza con un error cuyo `code`
 * es CULQI_CERRADO. Culqi Checkout no documenta un evento de "cancelado", así que se detecta
 * de tres formas: el callback `closeCheckout` si esta versión de Culqi lo llama, que su
 * ventana desaparezca sin haber entregado un token, o un tiempo máximo (el plazo de pago).
 * Antes la promesa quedaba sin resolver y el checkout se quedaba con el spinner para siempre.
 */
export async function abrirCulqiCheckout({ amountCentavos, email, metodoPago }) {
  if (!CULQI_PUBLIC_KEY) {
    throw new Error("Culqi no está configurado (falta VITE_CULQI_PUBLIC_KEY en el frontend)");
  }

  await cargarScriptCulqi();

  return new Promise((resolve, reject) => {
    const settings = {
      title: "Anita New Style",
      currency: "PEN",
      amount: amountCentavos,
    };

    const paymentMethods = {
      tarjeta: metodoPago === "tarjeta",
      yape: metodoPago === "yape",
      billetera: false,
      bancaMovil: false,
      agente: false,
      cuotealo: false,
    };

    const options = {
      lang: "auto",
      installments: false,
      modal: true,
      paymentMethods,
      paymentMethodsSort: Object.keys(paymentMethods),
    };

    const client = email ? { email } : {};
    const config = { settings, client, options };

    const Culqi = new window.CulqiCheckout(CULQI_PUBLIC_KEY, config);

    let terminado = false;
    let seVioAbierto = false;
    let revision = null;
    let limite = null;
    const terminar = () => {
      terminado = true;
      clearInterval(revision);
      clearTimeout(limite);
    };
    const cerradoSinPagar = () => {
      if (terminado) return;
      terminar();
      const error = new Error("Cerraste la ventana de pago sin completarla");
      error.code = CULQI_CERRADO;
      reject(error);
    };

    Culqi.culqi = () => {
      if (terminado) return;
      terminar();
      if (Culqi.token) {
        const token = Culqi.token;
        Culqi.close();
        resolve({ tokenId: token.id, email: token.email || email || null });
      } else {
        Culqi.close();
        const mensaje =
          Culqi.error?.user_message || Culqi.error?.merchant_message || "No se pudo procesar el pago";
        reject(new Error(mensaje));
      }
    };
    // Algunas versiones de Culqi Checkout llaman a este callback al cerrar; si no, no pasa nada.
    Culqi.closeCheckout = cerradoSinPagar;

    revision = setInterval(() => {
      const visible = widgetVisible();
      if (visible) seVioAbierto = true;
      else if (seVioAbierto) cerradoSinPagar();
    }, MS_REVISION);
    limite = setTimeout(cerradoSinPagar, MS_MAXIMO_WIDGET);

    Culqi.open();
  });
}
