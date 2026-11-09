-- Fase 2: todo producto tiene al menos UNA variante y el stock vive solo en las variantes.
--
-- Antes un producto sin tallas ni colores guardaba su stock en productos.stock y los demas
-- en variantes_producto: dos lugares para lo mismo y un "if usa variantes" en todo el
-- codigo. Ahora un producto simple (una gorra, por ejemplo) tiene una unica variante sin
-- talla ni color (los dos NULL), y el stock total del producto es la suma de sus variantes.
-- Tambien desaparecen las filas vacias ('') de tallas y colores que servian para decir
-- "no aplica": con NULLS NOT DISTINCT el NULL ya sirve y el UNIQUE sigue protegiendo.
-- Esta migracion funciona igual con la base vacia que con datos: los productos que ya
-- existen pasan a tener su variante unica con el stock que tenian.

-- 1) La variante puede no tener talla o color (NULL), sin repetirse
ALTER TABLE variantes_producto ALTER COLUMN talla_id DROP NOT NULL;
ALTER TABLE variantes_producto ALTER COLUMN color_id DROP NOT NULL;

UPDATE variantes_producto SET talla_id = NULL WHERE talla_id IN (SELECT id FROM tallas WHERE nombre = '');
UPDATE variantes_producto SET color_id = NULL WHERE color_id IN (SELECT id FROM colores WHERE nombre = '');
UPDATE imagenes_producto SET color_id = NULL WHERE color_id IN (SELECT id FROM colores WHERE nombre = '');

ALTER TABLE variantes_producto DROP CONSTRAINT uq_variante_producto;
ALTER TABLE variantes_producto ADD CONSTRAINT uq_variante_producto UNIQUE NULLS NOT DISTINCT (producto_id, talla_id, color_id);

-- 2) Cada producto sin variantes recibe su variante unica, con el stock que tenia
INSERT INTO variantes_producto (producto_id, talla_id, color_id, stock)
SELECT p.id, NULL, NULL, COALESCE(p.stock, 0)
FROM productos p
WHERE NOT EXISTS (SELECT 1 FROM variantes_producto v WHERE v.producto_id = p.id);

-- 3) Lo que ya existia de esos productos (kardex, pedidos, compras) apunta a su variante unica
UPDATE movimiento_stock m SET variante_id = v.id FROM variantes_producto v
WHERE m.variante_id IS NULL AND v.producto_id = m.producto_id AND v.talla_id IS NULL AND v.color_id IS NULL;

UPDATE detalles_pedido d SET variante_id = v.id FROM variantes_producto v
WHERE d.variante_id IS NULL AND v.producto_id = d.producto_id AND v.talla_id IS NULL AND v.color_id IS NULL;

UPDATE detalle_compra d SET variante_id = v.id FROM variantes_producto v
WHERE d.variante_id IS NULL AND v.producto_id = d.producto_id AND v.talla_id IS NULL AND v.color_id IS NULL;

-- 4) El carrito apunta a la variante y nada mas: el producto se deduce de ella
--    (guardar tambien producto_id repetia un dato que la variante ya determina)
UPDATE carrito c SET variante_id = v.id FROM variantes_producto v
WHERE c.variante_id IS NULL AND v.producto_id = c.producto_id AND v.talla_id IS NULL AND v.color_id IS NULL;
DELETE FROM carrito WHERE variante_id IS NULL;

ALTER TABLE carrito DROP CONSTRAINT uq_carrito_linea;
ALTER TABLE carrito DROP CONSTRAINT fk_carrito_variante;
ALTER TABLE carrito DROP COLUMN producto_id;
ALTER TABLE variantes_producto DROP CONSTRAINT uq_variante_id_producto;
ALTER TABLE carrito ALTER COLUMN variante_id SET NOT NULL;
ALTER TABLE carrito ADD CONSTRAINT fk_carrito_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto (id) ON DELETE CASCADE;
ALTER TABLE carrito ADD CONSTRAINT uq_carrito_linea UNIQUE (usuario_id, variante_id);
CREATE INDEX idx_carrito_variante ON carrito (variante_id);

-- 5) Fuera las filas vacias de tallas y colores; de ahora en adelante el nombre es obligatorio
DELETE FROM tallas WHERE nombre = '';
DELETE FROM colores WHERE nombre = '';
ALTER TABLE tallas ADD CONSTRAINT chk_tallas_nombre CHECK (nombre <> '');
ALTER TABLE colores ADD CONSTRAINT chk_colores_nombre CHECK (nombre <> '');

-- 6) El stock del producto ya no se guarda: es la suma de sus variantes
ALTER TABLE productos DROP CONSTRAINT chk_productos_stock;
ALTER TABLE productos DROP COLUMN stock;

-- 7) La regla "todo producto tiene variantes" la hace cumplir la propia base, al cerrar
--    la transaccion (asi se puede crear el producto y despues sus variantes):
--    - un producto siempre tiene al menos una variante
--    - la variante sin talla ni color solo puede ser la unica del producto
CREATE FUNCTION validar_variantes_del_producto() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    pid integer;
    total integer;
    sin_ejes integer;
BEGIN
    IF TG_TABLE_NAME = 'productos' THEN
        pid := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        pid := OLD.producto_id;
    ELSE
        pid := NEW.producto_id;
    END IF;

    -- Si el producto ya no existe (se borro junto con sus variantes) no hay nada que revisar
    IF NOT EXISTS (SELECT 1 FROM productos WHERE id = pid) THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE talla_id IS NULL AND color_id IS NULL)
      INTO total, sin_ejes
      FROM variantes_producto WHERE producto_id = pid;

    IF total = 0 THEN
        RAISE EXCEPTION 'El producto % debe tener al menos una variante', pid USING ERRCODE = '23514';
    END IF;
    IF total > 1 AND sin_ejes > 0 THEN
        RAISE EXCEPTION 'El producto %: una variante sin talla ni color solo puede ser la unica del producto', pid USING ERRCODE = '23514';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_producto_con_variante
    AFTER INSERT ON productos DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validar_variantes_del_producto();

CREATE CONSTRAINT TRIGGER trg_variantes_del_producto
    AFTER INSERT OR DELETE OR UPDATE OF producto_id, talla_id, color_id ON variantes_producto DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION validar_variantes_del_producto();
