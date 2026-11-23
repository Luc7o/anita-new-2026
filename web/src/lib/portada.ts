import "server-only";
import { and, asc, desc, eq, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { categorias, imagenesProducto, productos, promociones } from "@/db/schema";
import { listarProductos, type ProductoResumen } from "./catalogo";

export type Promocion = {
  id: number;
  etiqueta: string | null;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string;
  botonTexto: string;
  botonLink: string;
};

export type CategoriaPortada = { id: number; slug: string; nombre: string; foto: string | null };

/** Fecha de hoy en Lima (UTC-5), como Promocion.vigente en el backend. */
function hoyEnLima() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Promociones activas, dentro de su vigencia y con imagen (las únicas que entran al carrusel). */
async function promocionesVigentes(): Promise<Promocion[]> {
  const hoy = hoyEnLima();
  const filas = await db
    .select()
    .from(promociones)
    .where(
      and(
        eq(promociones.activo, true),
        or(isNull(promociones.fechaInicio), lte(promociones.fechaInicio, hoy)),
        or(isNull(promociones.fechaFin), gte(promociones.fechaFin, hoy))
      )
    )
    .orderBy(asc(promociones.orden), desc(promociones.id));
  return filas
    .filter((p) => p.imagenUrl)
    .map((p) => ({
      id: p.id,
      etiqueta: p.etiqueta || null,
      titulo: p.titulo,
      descripcion: p.descripcion || null,
      imagenUrl: p.imagenUrl!,
      botonTexto: p.botonTexto || "Ver todo",
      botonLink: p.botonLink || "/tienda",
    }));
}

/** Categorías activas con su foto; si no tienen, la de su producto más reciente con foto. */
async function categoriasConFoto(): Promise<CategoriaPortada[]> {
  const [cats, fotosProducto] = await Promise.all([
    db
      .select({ id: categorias.id, slug: categorias.slug, nombre: categorias.nombre, foto: categorias.imagenUrl })
      .from(categorias)
      .where(eq(categorias.activo, true))
      .orderBy(asc(categorias.nombre)),
    db
      .selectDistinctOn([productos.categoriaId], { categoriaId: productos.categoriaId, url: imagenesProducto.url })
      .from(productos)
      .innerJoin(imagenesProducto, eq(imagenesProducto.productoId, productos.id))
      .where(and(eq(productos.activo, true), isNotNull(imagenesProducto.url)))
      .orderBy(productos.categoriaId, desc(productos.fechaCreacion), asc(imagenesProducto.orden)),
  ]);
  const respaldo = new Map(fotosProducto.map((f) => [f.categoriaId, f.url]));
  return cats.map((c) => ({ ...c, foto: c.foto || respaldo.get(c.id) || null }));
}

export type DatosPortada = {
  promociones: Promocion[];
  categorias: CategoriaPortada[];
  ofertas: ProductoResumen[];
  /** "todo" y cada una de las primeras 5 categorías → sus 8 productos más nuevos. */
  nuevos: Record<string, ProductoResumen[]>;
};

export async function datosPortada(): Promise<DatosPortada> {
  const [promos, cats, ofertas] = await Promise.all([
    promocionesVigentes(),
    categoriasConFoto(),
    listarProductos({ oferta: true }),
  ]);
  const pestanas = ["todo", ...cats.slice(0, 5).map((c) => c.slug)];
  const listas = await Promise.all(
    pestanas.map((slug) => listarProductos({ categoria: slug === "todo" ? undefined : slug, orden: "nuevos" }))
  );
  return {
    promociones: promos,
    categorias: cats,
    ofertas: ofertas.productos.slice(0, 8),
    nuevos: Object.fromEntries(pestanas.map((slug, i) => [slug, listas[i]!.productos.slice(0, 8)])),
  };
}
