-- Ubigeo sin dato repetido: el departamento de un distrito ya se conoce por su
-- provincia (distrito -> provincia -> departamento), asi que guardarlo tambien
-- en ubigeo_distritos permitia contradicciones (un distrito de una provincia de
-- Junin marcado como de otro departamento). Se quita la columna redundante y
-- queda una sola ruta de relacion, sin triangulo.
-- El codigo sigue leyendo distrito.departamento y distrito.departamento_id: ahora
-- los calcula pasando por la provincia (ver app/models/ubicacion.py).

ALTER TABLE ubigeo_distritos DROP FOREIGN KEY fk_distritos_departamento;

ALTER TABLE ubigeo_distritos DROP INDEX idx_distritos_departamento;

ALTER TABLE ubigeo_distritos DROP COLUMN departamento_id;
