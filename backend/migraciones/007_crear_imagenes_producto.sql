CREATE TABLE IF NOT EXISTS imagenes_producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    url VARCHAR(400) NOT NULL,
    color VARCHAR(50),
    orden INT DEFAULT 0,
    fecha_creacion DATETIME NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Los productos que ya tenían una imagen (columna imagen_url) la conservan
-- como su primera imagen en la galería nueva.
INSERT INTO imagenes_producto (producto_id, url, color, orden, fecha_creacion)
SELECT id, imagen_url, NULL, 0, NOW()
FROM productos
WHERE imagen_url IS NOT NULL AND imagen_url != '';
