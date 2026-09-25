-- KPIs: uso de promociones por pedido.
--
-- OJO: en el código actual `promociones` es solo el banner rotativo del
-- inicio (Promocion.vigente), NO existe un sistema de cupones/códigos de
-- descuento que se aplique en el checkout. Esta tabla queda creada para
-- cuando exista esa función, pero HOY no hay ningún punto del backend que
-- vaya a insertar filas acá (KPIs de uso de promoción no van a tener datos
-- todavía). No se implementó lógica de registro para esta tabla.
CREATE TABLE IF NOT EXISTS promocion_uso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    promocion_id INT NOT NULL,
    pedido_id INT NOT NULL,
    usuario_id INT NULL,
    monto_descuento DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promocion_id) REFERENCES promociones(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
