-- El carrito apunta a la VARIANTE exacta (variantes_producto) en vez de guardar
-- talla y color sueltos. Antes se podian guardar combinaciones que no existen y la
-- base no podia impedir lineas repetidas, porque talla y color podian ser NULL.
--
-- Cambios:
-- (1) carrito.variante_id referencia la variante. Para productos sin variantes
--     queda en NULL (su stock vive en productos.stock).
-- (2) La clave foranea es (variante_id, producto_id): asi la base garantiza que la
--     variante pertenece al mismo producto de la linea. Si la variante se elimina,
--     su linea de carrito se elimina tambien (ya no se podria comprar).
-- (3) Una sola linea por usuario, producto y variante (UNIQUE sobre una columna
--     calculada que convierte el NULL en 0, porque MySQL permite varios NULL).
-- (4) Se eliminan talla_id y color_id del carrito: ya se obtienen de la variante.
-- Antes de agregar las reglas se arregla lo existente: se rellena variante_id, se
-- borran las lineas que ya eran invalidas (producto con variantes pero sin una
-- variante valida) y se juntan las lineas repetidas sumando sus cantidades.
-- La API no cambia: el carrito sigue mostrando talla y color como texto.

ALTER TABLE variantes_producto ADD CONSTRAINT uq_variante_id_producto UNIQUE (id, producto_id);

ALTER TABLE carrito ADD COLUMN variante_id INT NULL;

UPDATE carrito c JOIN variantes_producto v ON v.producto_id = c.producto_id AND v.talla_id = COALESCE(c.talla_id, (SELECT id FROM tallas WHERE nombre = '')) AND v.color_id = COALESCE(c.color_id, (SELECT id FROM colores WHERE nombre = '')) SET c.variante_id = v.id;

DELETE FROM carrito WHERE variante_id IS NULL AND producto_id IN (SELECT producto_id FROM variantes_producto);

UPDATE carrito c JOIN (SELECT MIN(id) AS conservar, SUM(cantidad) AS total FROM carrito GROUP BY usuario_id, producto_id, IFNULL(variante_id, 0) HAVING COUNT(*) > 1) d ON d.conservar = c.id SET c.cantidad = LEAST(d.total, 99);

DELETE c FROM carrito c JOIN (SELECT usuario_id, producto_id, IFNULL(variante_id, 0) AS clave, MIN(id) AS conservar FROM carrito GROUP BY usuario_id, producto_id, IFNULL(variante_id, 0) HAVING COUNT(*) > 1) d ON d.usuario_id = c.usuario_id AND d.producto_id = c.producto_id AND d.clave = IFNULL(c.variante_id, 0) WHERE c.id <> d.conservar;

ALTER TABLE carrito ADD CONSTRAINT fk_carrito_variante FOREIGN KEY (variante_id, producto_id) REFERENCES variantes_producto (id, producto_id) ON DELETE CASCADE;

ALTER TABLE carrito DROP FOREIGN KEY fk_carrito_talla;

ALTER TABLE carrito DROP FOREIGN KEY fk_carrito_color;

ALTER TABLE carrito DROP COLUMN talla_id;

ALTER TABLE carrito DROP COLUMN color_id;

ALTER TABLE carrito ADD COLUMN variante_clave INT GENERATED ALWAYS AS (IFNULL(variante_id, 0)) VIRTUAL;

ALTER TABLE carrito ADD CONSTRAINT uq_carrito_linea UNIQUE (usuario_id, producto_id, variante_clave);

ALTER TABLE carrito DROP INDEX usuario_id;
