-- Unifica la colación (reglas de comparación y orden de texto): 15 tablas
-- usaban utf8mb4_0900_ai_ci y las otras utf8mb4_unicode_ci. Quedan todas en
-- utf8mb4_unicode_ci, que es la que ya usaban las tablas principales y la que
-- declara el código. Ambas ignoran mayúsculas y tildes, así que las búsquedas
-- se comportan igual. También se fija como la colación por defecto de la base
-- para que las tablas nuevas nazcan igual.

ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE configuracion_tienda CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE evento_analitica CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE favoritos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE historial_estado_pedido CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE intento_pago CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE latencia_requests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE movimiento_stock CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE promocion_uso CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE promociones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE proveedor_productos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE reclamaciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE ubigeo_departamentos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE ubigeo_distritos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE ubigeo_provincias CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

