-- La migración 008 creó talla/color como columnas NULLABLE y sin UNIQUE,
-- pero el modelo Python (VarianteProducto) siempre esperó:
--   talla NOT NULL DEFAULT ''
--   color NOT NULL DEFAULT ''
--   UNIQUE(producto_id, talla, color)
-- Esta migración corrige el contrato SQL para que coincida.
--
-- IMPORTANTE: si alguna fila quedó con talla o color en NULL (por ejemplo,
-- si se insertaron variantes antes de esta corrección), las normalizamos a
-- '' primero. NO se tocan combinaciones ya válidas (no-NULL).
UPDATE variantes_producto SET talla = '' WHERE talla IS NULL;
UPDATE variantes_producto SET color = '' WHERE color IS NULL;

ALTER TABLE variantes_producto
    MODIFY talla VARCHAR(20) NOT NULL DEFAULT '',
    MODIFY color VARCHAR(50) NOT NULL DEFAULT '';

-- Antes de aplicar el UNIQUE, si por algún motivo ya existieran duplicados
-- reales (mismo producto_id + talla + color en más de una fila), este ALTER
-- fallará con un error de duplicate entry EXPLÍCITO en vez de aplicarse a
-- medias. Eso es intencional: un duplicado real en variantes de stock es un
-- conflicto de datos que hay que revisar a mano, no algo para ignorar
-- silenciosamente. Si esta migración falla por eso, hay que identificar y
-- resolver esas filas duplicadas (decidir cuál stock es el correcto) antes
-- de volver a correrla.
ALTER TABLE variantes_producto
    ADD CONSTRAINT uq_variante_producto UNIQUE (producto_id, talla, color);
