-- Filtro "Género" de la tienda: a quién va dirigido el producto.
-- Valores: mujer, hombre, unisex, nina, nino. NULL = sin definir (el producto
-- sigue apareciendo cuando no se filtra por género).

ALTER TABLE productos
    ADD COLUMN genero VARCHAR(20) NULL;
