CREATE TABLE IF NOT EXISTS proveedor_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    producto_id INT NOT NULL,
    precio_compra DECIMAL(10, 2),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL,
    UNIQUE KEY uq_proveedor_producto (proveedor_id, producto_id),
    CONSTRAINT fk_pp_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);
