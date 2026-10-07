-- KPIs: historial de cambios de estado.estado de un pedido, para medir
-- tiempos entre etapas (confirmado -> preparando -> enviado -> entregado).
CREATE TABLE IF NOT EXISTS historial_estado_pedido (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    estado_anterior VARCHAR(30) NOT NULL,
    estado_nuevo VARCHAR(30) NOT NULL,
    cambiado_por INT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (cambiado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id)
);
