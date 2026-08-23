-- Promociones de temporada (Día de la Madre, Día del Niño, Navidad, etc.)
-- que alimentan el carrusel del inicio.
CREATE TABLE IF NOT EXISTS promociones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etiqueta VARCHAR(60) DEFAULT '',
    titulo VARCHAR(150) NOT NULL,
    descripcion VARCHAR(400) DEFAULT '',
    imagen_url VARCHAR(400) DEFAULT '',
    boton_texto VARCHAR(60) DEFAULT 'Ver Todo',
    boton_link VARCHAR(200) DEFAULT '/tienda',
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    fecha_creacion DATETIME NOT NULL,
    fecha_actualizacion DATETIME NOT NULL
);
