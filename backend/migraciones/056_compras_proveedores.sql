-- ============================================================================
-- 056_compras_proveedores.sql
-- Fase 2 del modulo de almacen. Registra las compras a proveedores. Al
-- registrar una compra el stock de cada linea sube y queda un movimiento en
-- el kardex con el proveedor y el costo. Tambien guarda el costo promedio
-- de cada producto, que usaran la valorizacion y el margen.
--
-- Es seguro ejecutarla mas de una vez.
-- ============================================================================

CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT NOT NULL,
    tipo_documento VARCHAR(20) NULL,
    numero_documento VARCHAR(40) NULL,
    fecha_compra DATE NOT NULL,
    estado ENUM('recibida', 'anulada') NOT NULL DEFAULT 'recibida',
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    notas TEXT NULL,
    usuario_id INT NULL,
    anulada_por INT NULL,
    fecha_anulacion DATETIME NULL,
    motivo_anulacion VARCHAR(255) NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    CONSTRAINT fk_compras_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_compras_anulada_por FOREIGN KEY (anulada_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_compras_proveedor (proveedor_id),
    INDEX idx_compras_fecha (fecha_compra)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    variante_id INT NULL,
    talla VARCHAR(20) NULL,
    color VARCHAR(50) NULL,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_detcompra_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    CONSTRAINT fk_detcompra_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_detcompra_variante FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL,
    CONSTRAINT chk_detcompra_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detcompra_costo CHECK (costo_unitario >= 0),
    INDEX idx_detcompra_compra (compra_id),
    INDEX idx_detcompra_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE productos ADD COLUMN costo_promedio DECIMAL(10,2) NULL;

ALTER TABLE movimiento_stock
    MODIFY COLUMN tipo ENUM(
        'venta', 'restauracion', 'stock_inicial', 'ingreso_compra',
        'ajuste_manual', 'merma', 'inventario_fisico', 'anulacion_compra'
    ) NOT NULL;

ALTER TABLE movimiento_stock ADD COLUMN compra_id INT NULL;

ALTER TABLE movimiento_stock
    ADD CONSTRAINT fk_movstock_compra FOREIGN KEY (compra_id)
        REFERENCES compras(id) ON DELETE SET NULL;
