-- Agrega el sistema de roles. Todos los usuarios existentes quedan como "cliente",
-- excepto los que ya tenían es_admin = TRUE, que pasan a "superadmin".
ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'cliente';

UPDATE usuarios SET rol = 'superadmin' WHERE es_admin = TRUE;
