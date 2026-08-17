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

/**
 * Abre el widget de Culqi (tarjeta o Yape) por el monto indicado y se
 * resuelve con { tokenId, email } cuando el cliente completa el pago.
 * Se rechaza si Culqi devuelve un error (tarjeta inválida, Yape mal
 * ingresado, etc).
 *
 * OJO — limitación conocida: si el cliente cierra el popup con la "X" sin
 * llegar a pagar, Culqi Checkout no dispara ningún callback (no hay evento
 * de "cancelado" documentado), así que esta promesa se queda sin resolver.
 * El botón de "Pagar" se lo dejamos deshabilitado mientras tanto; si esto
 * resulta molesto en la práctica conviene agregar un timeout o revisarlo
 * con soporte de Culqi.
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

    Culqi.culqi = () => {
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

    Culqi.open();
  });
}
