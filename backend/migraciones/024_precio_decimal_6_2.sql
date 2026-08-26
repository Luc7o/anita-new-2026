-- ============================================================================
-- 024_precio_decimal_6_2.sql
-- Ajusta la precisión de los precios de producto a DECIMAL(6,2), por
-- sugerencia del profesor. DECIMAL(6,2) permite hasta 9999.99 — de sobra
-- para los precios actuales de la tienda, y evita el margen excesivo (hasta
-- 8 dígitos enteros) que tenía antes sin necesidad real.
-- ============================================================================

ALTER TABLE productos MODIFY COLUMN precio DECIMAL(6,2) NOT NULL;
ALTER TABLE productos MODIFY COLUMN precio_oferta DECIMAL(6,2) NULL;
