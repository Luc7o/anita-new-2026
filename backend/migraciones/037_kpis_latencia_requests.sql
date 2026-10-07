-- KPIs: latencia y status code por request, para monitoreo de performance.
CREATE TABLE IF NOT EXISTS latencia_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(150) NOT NULL,
    metodo VARCHAR(10) NOT NULL,
    latencia_ms INT NOT NULL,
    status_code SMALLINT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint)
);
