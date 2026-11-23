import type { MetadataRoute } from "next";
import { listarCategorias, productosParaSitemap } from "@/lib/catalogo";
import { URL_TIENDA } from "@/lib/sitio";

export const revalidate = 3600;

const FIJAS = ["/", "/tienda", "/reviews", "/tiendas", "/quienes-somos", "/contacto", "/faq", "/formas-de-pago", "/metodos-de-envio", "/cambios-devoluciones"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productos, categorias] = await Promise.all([productosParaSitemap(), listarCategorias()]);
  return [
    ...FIJAS.map((ruta) => ({ url: `${URL_TIENDA}${ruta}` })),
    ...categorias.map((c) => ({ url: `${URL_TIENDA}/tienda?categoria=${encodeURIComponent(c.slug)}` })),
    ...productos.map((p) => ({
      url: `${URL_TIENDA}/producto/${p.id}`,
      lastModified: new Date(`${p.actualizado ?? p.creado}Z`),
    })),
  ];
}
