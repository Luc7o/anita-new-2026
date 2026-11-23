import type { Metadata } from "next";
import { PaginaInfo } from "@/componentes/info/PaginaInfo";
import { BotonesContacto } from "@/componentes/info/BotonesContacto";

export const metadata: Metadata = { title: "Preguntas frecuentes" };
export const revalidate = 300;

export default async function FAQ() {
  return (
    <PaginaInfo
      titulo="Preguntas Frecuentes"
      volver="/"
    >
        <div className="space-y-6">
          <p className="text-lg text-plum-soft">Resolvemos tus dudas más comunes sobre compras, envíos y devoluciones.</p>

          <div className="space-y-4">
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">¿Cómo puedo comprar en Anita New Style?</h3>
              <p className="mt-1 text-sm text-plum-soft">Selecciona los productos que te gusten, elige talla y color, agrégalos al carrito y sigue los pasos del checkout. Puedes pagar con tarjeta (Visa o Mastercard) o Yape.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">¿Cuánto tiempo tarda el envío?</h3>
              <p className="mt-1 text-sm text-plum-soft">El delivery es solo en Huancayo y tarda de 3 a 5 días hábiles. También puedes recoger tu pedido sin costo en nuestra tienda de Huancayo.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">¿Puedo cambiar o devolver un producto?</h3>
              <p className="mt-1 text-sm text-plum-soft">Sí. Aceptamos cambios y devoluciones hasta 30 días después de la compra. Debe estar en su empaque original y sin uso.</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">¿Dónde está la tienda física?</h3>
              <p className="mt-1 text-sm text-plum-soft">Estamos en Huancayo. La dirección exacta la encontrarás en la sección "Contáctanos".</p>
            </div>
            <div className="rounded-xl border border-plum/10 bg-white/50 p-5 shadow-xs">
              <h3 className="font-semibold text-plum">¿Cómo puedo contactar con atención al cliente?</h3>
              <p className="mt-1 mb-3 text-sm text-plum-soft">Puedes escribirnos por estos medios:</p>
              <BotonesContacto
                mensaje="Hola, tengo una consulta."
                asunto="Consulta de atención al cliente"
              />
            </div>
          </div>
        </div>
      </PaginaInfo>
  );
}