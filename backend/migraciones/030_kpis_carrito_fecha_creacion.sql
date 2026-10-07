-- KPIs: fecha de creación de cada línea de carrito, para medir abandono
-- (cuánto tiempo pasa entre agregar algo al carrito y comprarlo o nunca
-- comprarlo).
ALTER TABLE carrito
    ADD COLUMN fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
