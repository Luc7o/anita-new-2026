-- Guarda la referencia histórica directa a la variante comprada en cada
-- detalle de pedido. Antes solo se guardaba producto_id + talla + color,
-- lo que hacía depender la restauración de stock de volver a encontrar
-- esa combinación exacta en variantes_producto — si la variante cambiaba
-- o se borraba después del pedido, la restauración podía fallar en
-- silencio. NULL para pedidos antiguos (no se puede reconstruir el dato
-- retroactivamente) y para productos sin variantes.
ALTER TABLE detalles_pedido
    ADD COLUMN variante_id INT NULL,
    ADD CONSTRAINT fk_detalle_variante FOREIGN KEY (variante_id)
        REFERENCES variantes_producto(id) ON DELETE SET NULL;
