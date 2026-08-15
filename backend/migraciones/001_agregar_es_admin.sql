-- Agrega el rol de administrador a los usuarios existentes.
-- Los usuarios ya creados quedan con es_admin = FALSE por defecto.
ALTER TABLE usuarios ADD COLUMN es_admin BOOLEAN NOT NULL DEFAULT FALSE;
