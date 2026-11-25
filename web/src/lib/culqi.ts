"use client";

// Culqi Checkout (tarjeta y Yape).
// Culqi tokeniza los datos sensibles en el navegador (nunca pasan por nuestro backend)
// y nos entrega un token que se manda a POST /pedidos/:id/pagar para el cobro real.
// Doc: https://docs.culqi.com/es/documentacion/checkout/checkout-custom

const LLAVE_PUBLICA = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
const URL_SCRIPT = "https://js.culqi.com/checkout-js";

/** El cliente cerró la ventana sin pagar. */
export const CULQI_CERRADO = "culqi_cerrado";

// Máximo que se espera al widget: lo mismo que dura el plazo de pago del pedido (20 min).
const MS_MAXIMO_WIDGET = 20 * 60 * 1000;
const MS_REVISION = 700;

type CulqiInstancia = {
  token?: { id: string; email?: string } | null;
  error?: { user_message?: string; merchant_message?: string } | null;
  culqi: () => void;
  closeCheckout?: () => void;
  open: () => void;
  close: () => void;
};

declare global {
  interface Window {
    CulqiCheckout?: new (llave: string, config: unknown) => CulqiInstancia;
  }
}

let cargaScript: Promise<void> | null = null;

function cargarScript() {
  if (window.CulqiCheckout) return Promise.resolve();
  cargaScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = URL_SCRIPT;
    s.onload = () => resolve();
    s.onerror = () => {
      cargaScript = null;
      reject(new Error("No se pudo cargar el checkout de Culqi"));
    };
    document.body.appendChild(s);
  });
  return cargaScript;
}

// La ventana del widget es un iframe de Culqi; se considera abierta si existe y se ve.
function widgetVisible() {
  const marco = document.querySelector<HTMLIFrameElement>('iframe[src*="culqi"]');
  if (!marco) return false;
  const estilo = getComputedStyle(marco);
  return estilo.display !== "none" && estilo.visibility !== "hidden" && marco.offsetParent !== null;
}

export class ErrorCulqi extends Error {
  code?: string;
}

/**
 * Abre el widget por el monto indicado y se resuelve con { tokenId, email } cuando el
 * cliente completa el pago. Se rechaza con el mensaje de Culqi si algo falla, o con
 * code = CULQI_CERRADO si cierra la ventana sin pagar (Culqi no documenta un evento de
 * "cancelado": se detecta por el callback closeCheckout, porque su iframe desaparece
 * sin haber dado un token, o por el tiempo máximo).
 */
export async function abrirCulqiCheckout({ montoCentavos, email, metodoPago }: { montoCentavos: number; email: string | null; metodoPago: string }) {
  if (!LLAVE_PUBLICA) throw new Error("Culqi no está configurado (falta NEXT_PUBLIC_CULQI_PUBLIC_KEY)");
  await cargarScript();

  return new Promise<{ tokenId: string; email: string | null }>((resolve, reject) => {
    const metodos = { tarjeta: metodoPago === "tarjeta", yape: metodoPago === "yape", billetera: false, bancaMovil: false, agente: false, cuotealo: false };
    const Culqi = new window.CulqiCheckout!(LLAVE_PUBLICA, {
      settings: { title: "Anita New Style", currency: "PEN", amount: montoCentavos },
      client: email ? { email } : {},
      options: { lang: "auto", installments: false, modal: true, paymentMethods: metodos, paymentMethodsSort: Object.keys(metodos) },
    });

    let terminado = false;
    let seVioAbierto = false;
    const terminar = () => {
      terminado = true;
      clearInterval(revision);
      clearTimeout(limite);
    };
    const cerradoSinPagar = () => {
      if (terminado) return;
      terminar();
      const e = new ErrorCulqi("Cerraste la ventana de pago sin completarla");
      e.code = CULQI_CERRADO;
      reject(e);
    };

    Culqi.culqi = () => {
      if (terminado) return;
      terminar();
      const token = Culqi.token;
      Culqi.close();
      if (token) resolve({ tokenId: token.id, email: token.email || email || null });
      else reject(new ErrorCulqi(Culqi.error?.user_message || Culqi.error?.merchant_message || "No se pudo procesar el pago"));
    };
    Culqi.closeCheckout = cerradoSinPagar;

    const revision = setInterval(() => {
      if (widgetVisible()) seVioAbierto = true;
      else if (seVioAbierto) cerradoSinPagar();
    }, MS_REVISION);
    const limite = setTimeout(cerradoSinPagar, MS_MAXIMO_WIDGET);

    Culqi.open();
  });
}

// Clave de idempotencia del INTENTO DE PAGO (una por pedido, sobrevive a recargas):
// dos clics en "Pagar" mandan tokens distintos y el backend la usa para no cobrar dos veces.
export function claveIdempotenciaPago(pedidoId: number) {
  const k = `ans_pago_idempotency_key_${pedidoId}`;
  try {
    const existente = sessionStorage.getItem(k);
    if (existente) return existente;
    const nueva = crypto.randomUUID();
    sessionStorage.setItem(k, nueva);
    return nueva;
  } catch {
    return crypto.randomUUID();
  }
}

export function limpiarClaveIdempotenciaPago(pedidoId: number) {
  try {
    sessionStorage.removeItem(`ans_pago_idempotency_key_${pedidoId}`);
  } catch {
    // no-op
  }
}
