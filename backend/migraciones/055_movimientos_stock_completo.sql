-- ============================================================================
-- 055_movimientos_stock_completo.sql
-- Fase 1 del modulo de almacen. Convierte movimiento_stock (que solo guardaba
-- ventas y restauraciones) en un kardex completo: cada cambio de stock queda
-- con quien lo hizo, por que, y cuanto stock habia antes y despues.
--
-- Convencion de la columna cantidad
--   venta y restauracion siguen igual que antes, siempre positivas
--   (la direccion la da el tipo)
--   los tipos nuevos guardan la diferencia con signo
--   (positiva si entra stock, negativa si sale)
--
-- Es seguro ejecutarla mas de una vez.
-- ============================================================================

ALTER TABLE movimiento_stock
    MODIFY COLUMN tipo ENUM(
        'venta', 'restauracion', 'stock_inicial', 'ingreso_compra',
        'ajuste_manual', 'merma', 'inventario_fisico'
    ) NOT NULL;

ALTER TABLE movimiento_stock ADD COLUMN usuario_id INT NULL;

ALTER TABLE movimiento_stock ADD COLUMN motivo VARCHAR(255) NULL;

ALTER TABLE movimiento_stock ADD COLUMN stock_antes INT NULL;

ALTER TABLE movimiento_stock ADD COLUMN stock_despues INT NULL;

ALTER TABLE movimiento_stock ADD COLUMN costo_unitario DECIMAL(10,2) NULL;

ALTER TABLE movimiento_stock ADD COLUMN proveedor_id INT NULL;

ALTER TABLE movimiento_stock
    ADD CONSTRAINT fk_movstock_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL;

ALTER TABLE movimiento_stock
    ADD CONSTRAINT fk_movstock_proveedor FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id) ON DELETE SET NULL;

CREATE INDEX idx_movstock_producto_fecha ON movimiento_stock (producto_id, fecha_creacion);
