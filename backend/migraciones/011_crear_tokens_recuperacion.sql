CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    expira_en DATETIME NOT NULL,
    creado_en DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token_recuperacion (token)
);
