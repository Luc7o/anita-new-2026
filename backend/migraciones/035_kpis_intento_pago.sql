-- KPIs: cada intento de cobro/reembolso contra Culqi (aprobado/rechazado/
-- reembolsado), para tasa de rechazo y motivos de rechazo más comunes.
-- No hay webhook de Culqi en este proyecto: el cobro es síncrono dentro de
-- POST /api/pedidos/<id>/pagar, así que ese es el único punto que inserta
-- filas de tipo cobro. El reembolso se registra en
-- PUT /api/admin/pedidos/<id>/pago.
CREATE TABLE IF NOT EXISTS intento_pago (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('aprobado','rechazado','reembolsado') NOT NULL,
    codigo_culqi VARCHAR(40) NULL,
    motivo_rechazo VARCHAR(255) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id)
);
