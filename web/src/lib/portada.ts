import "server-only";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { categorias, imagenesProducto, productos, promociones } from "@/db/schema";
import { listarProductos, type ProductoResumen } from "./catalogo";
import { calcularPrecios } from "./precio";

/** Producto ligado a una diapositiva: se muestra su precio (y el anterior si está en oferta). */
export type ProductoDiapositiva = { id: number; nombre: string; precioFinal: number; precio: number; tieneOferta: boolean };

/**
 * Una diapositiva del carrusel de la portada. Viene de una Promoción del panel (su imagen
 * idealmente es un PNG sin fondo o un render 3D) o, si no hay ninguna vigente, de un
 * producto destacado.
 */
export type Diapositiva = {
  id: string;
  etiqueta: string | null;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string;
  botonTexto: string;
  botonLink: string;
  producto: ProductoDiapositiva | null;
};

export type CategoriaPortada = { id: number; slug: string; nombre: string; foto: string | null };

/** Fecha de hoy en Lima (UTC-5), como Promocion.vigente en el backend. */
function hoyEnLima() {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** Promociones activas, dentro de su vigencia y con imagen (las únicas que entran al carrusel). */
async function promocionesVigentes(): Promise<Diapositiva[]> {
  const hoy = hoyEnLima();
  const filas = (
    await db
      .select()
      .from(promociones)
      .where(
        and(
          eq(promociones.activo, true),
          or(isNull(promociones.fechaInicio), lte(promociones.fechaInicio, hoy)),
          or(isNull(promociones.fechaFin), gte(promociones.fechaFin, hoy))
        )
      )
      .orderBy(asc(promociones.orden), desc(promociones.id))
  ).filter((p) => p.imagenUrl);

  const ids = filas.map((p) => p.productoId).filter((id): id is number => id !== null);
  const ligados = ids.length
    ? await db
        .select({ id: productos.id, nombre: productos.nombre, precio: productos.precio, precioOferta: productos.precioOferta })
        .from(productos)
        .where(and(inArray(productos.id, ids), eq(productos.activo, true)))
    : [];
  const porId = new Map(
    ligados.map((p) => {
      const { precio, precioFinal, tieneOferta } = calcularPrecios(p.precio, p.precioOferta);
      return [p.id, { id: p.id, nombre: p.nombre, precio, precioFinal, tieneOferta }];
    })
  );

  return filas.map((p) => {
    const producto = (p.productoId && porId.get(p.productoId)) || null;
    return {
      id: `promo-${p.id}`,
      etiqueta: p.etiqueta || null,
      titulo: p.titulo,
      descripcion: p.descripcion || null,
      imagenUrl: p.imagenUrl!,
      botonTexto: p.botonTexto || "Ver todo",
      botonLink: p.botonLink || (producto ? `/producto/${producto.id}` : "/tienda"),
      producto,
    };
  });
}

/** Sin promociones vigentes: los productos en oferta (o los más nuevos) con su primera foto. */
function diapositivasDeProductos(lista: ProductoResumen[]): Diapositiva[] {
  return lista
    .filter((p) => p.imagenUrl)
    .slice(0, 5)
    .map((p) => ({
      id: `producto-${p.id}`,
      etiqueta: p.tieneOferta ? `-${p.descuentoPorcentaje}%` : p.esNuevo ? "Nuevo" : null,
      titulo: p.nombre,
      descripcion: p.categoria ? p.categoria.nombre : null,
      imagenUrl: p.imagenUrl!,
      botonTexto: "Ver producto",
      botonLink: `/producto/${p.id}`,
      producto: { id: p.id, nombre: p.nombre, precio: p.precio, precioFinal: p.precioFinal, tieneOferta: p.tieneOferta },
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
  diapositivas: Diapositiva[];
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
  const respaldo = ofertas.productos.length ? ofertas.productos : listas[0]!.productos;
  return {
    diapositivas: promos.length ? promos : diapositivasDeProductos(respaldo),
    categorias: cats,
    ofertas: ofertas.productos.slice(0, 8),
    nuevos: Object.fromEntries(pestanas.map((slug, i) => [slug, listas[i]!.productos.slice(0, 8)])),
  };
}
