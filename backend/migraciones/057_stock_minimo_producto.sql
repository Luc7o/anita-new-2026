-- ============================================================================
-- 057_stock_minimo_producto.sql
-- Fase 3 del modulo de almacen. Cada producto tiene su propio stock minimo
-- (antes el aviso de poco stock era siempre 3 unidades para todos). Los
-- productos que ya existen quedan con 3, asi nada cambia hasta que lo ajustes.
--
-- Es seguro ejecutarla mas de una vez.
-- ============================================================================

ALTER TABLE productos ADD COLUMN stock_minimo INT NOT NULL DEFAULT 3;

ALTER TABLE productos ADD CONSTRAINT chk_productos_stock_minimo CHECK (stock_minimo >= 0);
