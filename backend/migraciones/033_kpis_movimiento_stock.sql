-- KPIs: bitácora de cada movimiento de stock (venta o restauración), para
-- reconstruir stock histórico y tasas de quiebre por producto/fecha.
CREATE TABLE IF NOT EXISTS movimiento_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variante_id INT NULL,
    producto_id INT NULL,
    tipo ENUM('venta','restauracion') NOT NULL,
    cantidad INT NOT NULL,
    pedido_id INT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    INDEX idx_variante (variante_id),
    INDEX idx_producto (producto_id)
);
