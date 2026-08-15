-- Agrega tipo y número de documento de identidad (DNI, RUC o Carné de
-- Extranjería) al usuario, para poder validarlo contra una API de APIs Perú
-- al momento del registro.
ALTER TABLE usuarios ADD COLUMN tipo_documento VARCHAR(10);
ALTER TABLE usuarios ADD COLUMN numero_documento VARCHAR(15);
ALTER TABLE usuarios ADD UNIQUE INDEX idx_usuarios_numero_documento (numero_documento);
