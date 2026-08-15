CREATE TABLE IF NOT EXISTS variantes_producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    talla VARCHAR(20),
    color VARCHAR(50),
    stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Nota: los productos que ya tenías cargados con tallas/colores NO se migran
-- automáticamente a variantes (no hay forma segura de repartir el stock actual
-- entre combinaciones sin adivinar). Van a seguir funcionando con su stock total
-- de siempre hasta que los edites en el admin y definas el stock por variante ahí.
