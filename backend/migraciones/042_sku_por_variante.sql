-- SKU propio para cada combinación talla/color (ej. VES-000123-M-ROJ).
-- NULL en las variantes existentes hasta correr generar_skus_faltantes.py;
-- el UNIQUE admite varios NULL, así que no choca mientras tanto.
ALTER TABLE variantes_producto ADD COLUMN sku VARCHAR(80) NULL;
ALTER TABLE variantes_producto ADD CONSTRAINT uq_variante_sku UNIQUE (sku);

-- Copia del SKU vendido en cada línea de pedido (histórico). NULL en los
-- pedidos anteriores hasta correr generar_skus_faltantes.py.
ALTER TABLE detalles_pedido ADD COLUMN sku VARCHAR(80) NULL;
