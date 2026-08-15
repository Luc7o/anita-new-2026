CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto_nombre VARCHAR(120),
    telefono VARCHAR(20),
    email VARCHAR(120),
    direccion VARCHAR(200),
    ruc VARCHAR(20),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL
);
