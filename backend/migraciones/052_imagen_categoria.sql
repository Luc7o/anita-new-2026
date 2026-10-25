-- Foto propia de cada categoría (círculos del Home y listado del admin).
-- Es opcional: si una categoría no tiene foto, el Home sigue usando la de uno
-- de sus productos y, si tampoco hay, la inicial del nombre.
-- Ejecutar UNA sola vez (MySQL no permite ADD COLUMN IF NOT EXISTS).

ALTER TABLE categorias
    ADD COLUMN imagen_url VARCHAR(500) NULL;
