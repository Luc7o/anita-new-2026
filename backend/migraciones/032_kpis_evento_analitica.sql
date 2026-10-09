-- KPIs: eventos de tráfico/embudo (vista de producto, agregar al carrito,
-- inicio de checkout, compra completada) para tasas de conversión.
CREATE TABLE IF NOT EXISTS evento_analitica (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento ENUM('vista_pagina','vista_producto','agregar_carrito','inicio_checkout','compra_completada') NOT NULL,
    producto_id INT NULL,
    usuario_id INT NULL,
    sesion_id VARCHAR(64) NOT NULL,
    metadata JSON NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tipo_fecha (tipo_evento, creado_en),
    INDEX idx_sesion (sesion_id)
);
