CREATE TABLE IF NOT EXISTS configuracion_pagos (
    id INT PRIMARY KEY,
    yape_numero VARCHAR(20),
    yape_titular VARCHAR(120),
    yape_qr_url VARCHAR(400),
    actualizado_en DATETIME
);
