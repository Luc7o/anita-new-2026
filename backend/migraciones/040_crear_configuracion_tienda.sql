-- Configuración general de la tienda, editable desde el panel admin.
-- Un único registro (id = 1), como ya se hacía con configuracion_pagos
-- (ver migración 005, eliminada en la 017). Antes estos datos vivían fijos
-- en frontend/src/datosEmpresa.js: cambiar un teléfono exigía tocar código
-- y volver a desplegar. Ahora se guardan en BD y se administran en vivo.
CREATE TABLE IF NOT EXISTS configuracion_tienda (
    id INT PRIMARY KEY DEFAULT 1,

    nombre_comercial VARCHAR(120) NOT NULL DEFAULT 'Anita New Style',
    logo_url VARCHAR(400),

    -- Contacto
    correo_contacto VARCHAR(120),
    telefono VARCHAR(20),
    whatsapp VARCHAR(20),

    -- Tienda física
    direccion VARCHAR(200),
    referencia VARCHAR(200),
    ciudad VARCHAR(80),
    horario_atencion VARCHAR(120),
    maps_url VARCHAR(400),

    -- Redes sociales
    facebook_url VARCHAR(200),
    instagram_url VARCHAR(200),
    tiktok_url VARCHAR(200),

    -- Regional
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',

    actualizado_en DATETIME,

    CONSTRAINT chk_configuracion_tienda_un_registro CHECK (id = 1)
);

INSERT INTO configuracion_tienda (id, nombre_comercial, moneda)
VALUES (1, 'Anita New Style', 'PEN')
ON DUPLICATE KEY UPDATE id = id;
