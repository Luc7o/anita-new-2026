-- Libro de Reclamaciones virtual (hoja de reclamacion de Indecopi).
-- El codigo (N° de la hoja) se arma con el id y el anio, asi es unico sin
-- riesgo de que dos reclamos simultaneos reciban el mismo numero.
CREATE TABLE IF NOT EXISTS reclamaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NULL UNIQUE,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATE NOT NULL,

    consumidor_nombre VARCHAR(150) NOT NULL,
    consumidor_doc_tipo VARCHAR(5) NOT NULL,
    consumidor_documento VARCHAR(20) NOT NULL,
    consumidor_domicilio VARCHAR(250) NOT NULL,
    consumidor_telefono VARCHAR(30) NOT NULL,
    consumidor_email VARCHAR(150) NOT NULL,
    apoderado_nombre VARCHAR(150) NULL,

    bien_tipo VARCHAR(10) NOT NULL,
    bien_descripcion VARCHAR(400) NOT NULL,
    monto_reclamado DECIMAL(10,2) NULL,
    numero_pedido VARCHAR(40) NULL,

    tipo VARCHAR(10) NOT NULL,
    detalle TEXT NOT NULL,
    pedido_consumidor TEXT NOT NULL,

    estado VARCHAR(15) NOT NULL DEFAULT 'pendiente',
    respuesta TEXT NULL,
    fecha_respuesta DATETIME NULL,
    respondido_por INT NULL,

    FOREIGN KEY (respondido_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_reclamaciones_estado_limite ON reclamaciones (estado, fecha_limite);
