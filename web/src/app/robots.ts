import type { MetadataRoute } from "next";
import { URL_TIENDA } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/carrito", "/checkout", "/pedidos", "/perfil", "/admin", "/ingresar", "/registro"] },
    sitemap: `${URL_TIENDA}/sitemap.xml`,
  };
}
