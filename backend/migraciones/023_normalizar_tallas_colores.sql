-- ============================================================================
-- 023_normalizar_tallas_colores.sql
-- Antes: "talla" y "color" vivían como texto libre repetido en cada fila de
-- variantes_producto, carrito e imagenes_producto (y ADEMÁS resumidos otra
-- vez en productos.tallas/productos.colores como JSON). Nada garantizaba
-- que "Rojo" estuviera escrito siempre igual, y corregir un nombre requería
-- tocar todas las filas que lo usaran.
--
-- Ahora: dos tablas catálogo (tallas, colores) son la única fuente de
-- verdad, y todo lo demás las referencia por id.
--
-- El registro con nombre='' en cada catálogo es un placeholder: significa
-- "este producto no varía por este eje" — se necesita como fila real (no
-- NULL) para que el UNIQUE de variantes_producto seguir funcionando igual
-- que antes (en MySQL, NULL nunca es igual a otro NULL dentro de un UNIQUE).
-- ============================================================================

-- 1) Catálogos ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tallas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    orden INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS colores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
    codigo_hex VARCHAR(7)
);

INSERT IGNORE INTO tallas (id, nombre, orden) VALUES (1, '', 0);
INSERT IGNORE INTO colores (id, nombre, codigo_hex) VALUES (1, '', NULL);

-- Si esta migración ya había creado tallas/colores en un intento anterior
-- (antes de que este archivo trajera COLLATE explícito), la tabla pudo
-- quedar con el collation por defecto del servidor (utf8mb4_0900_ai_ci),
-- distinto al que usan las columnas de texto viejas (utf8mb4_unicode_ci) —
-- eso rompe los JOIN de más abajo con "Illegal mix of collations". Este
-- ALTER es un no-op si el collation ya está correcto, así que es seguro
-- volver a correrlo.
ALTER TABLE tallas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE colores CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Catálogo real, tomado de todo lo que ya se usa hoy (variantes es la
-- fuente principal — carrito e imágenes se agregan por si acaso quedó
-- algún valor suelto que no esté en variantes).
INSERT IGNORE INTO tallas (nombre)
    SELECT DISTINCT talla FROM variantes_producto WHERE talla IS NOT NULL AND talla <> '';
INSERT IGNORE INTO tallas (nombre)
    SELECT DISTINCT talla FROM carrito WHERE talla IS NOT NULL AND talla <> '';

INSERT IGNORE INTO colores (nombre)
    SELECT DISTINCT color FROM variantes_producto WHERE color IS NOT NULL AND color <> '';
INSERT IGNORE INTO colores (nombre)
    SELECT DISTINCT color FROM carrito WHERE color IS NOT NULL AND color <> '';
INSERT IGNORE INTO colores (nombre)
    SELECT DISTINCT color FROM imagenes_producto WHERE color IS NOT NULL AND color <> '';

-- 2) variantes_producto: talla/color -> talla_id/color_id -----------------
ALTER TABLE variantes_producto ADD COLUMN talla_id INT NULL;
ALTER TABLE variantes_producto ADD COLUMN color_id INT NULL;

UPDATE variantes_producto vp JOIN tallas t ON t.nombre = vp.talla SET vp.talla_id = t.id;
UPDATE variantes_producto vp JOIN colores c ON c.nombre = vp.color SET vp.color_id = c.id;
-- Red de seguridad por si algo no calzó (no debería pasar, talla/color
-- siempre tenían valor por defecto '').
UPDATE variantes_producto SET talla_id = (SELECT id FROM tallas WHERE nombre = '') WHERE talla_id IS NULL;
UPDATE variantes_producto SET color_id = (SELECT id FROM colores WHERE nombre = '') WHERE color_id IS NULL;

ALTER TABLE variantes_producto MODIFY COLUMN talla_id INT NOT NULL;
ALTER TABLE variantes_producto MODIFY COLUMN color_id INT NOT NULL;

-- El índice viejo (uq_variante_producto, sobre producto_id/talla/color) es
-- el que MySQL usa por debajo para respaldar la FK de producto_id ->
-- productos.id — no se puede soltar hasta que exista otro índice que
-- también empiece por producto_id. Por eso el nuevo se crea PRIMERO, y
-- recién con eso se puede borrar el viejo y renombrar el nuevo a su lugar.
ALTER TABLE variantes_producto ADD CONSTRAINT uq_variante_producto_nuevo UNIQUE (producto_id, talla_id, color_id);
ALTER TABLE variantes_producto DROP INDEX uq_variante_producto;
ALTER TABLE variantes_producto RENAME INDEX uq_variante_producto_nuevo TO uq_variante_producto;

ALTER TABLE variantes_producto ADD CONSTRAINT fk_variantes_talla FOREIGN KEY (talla_id) REFERENCES tallas(id);
ALTER TABLE variantes_producto ADD CONSTRAINT fk_variantes_color FOREIGN KEY (color_id) REFERENCES colores(id);

ALTER TABLE variantes_producto CHANGE COLUMN talla talla_legacy VARCHAR(20) NULL;
ALTER TABLE variantes_producto CHANGE COLUMN color color_legacy VARCHAR(50) NULL;

CREATE INDEX idx_variantes_talla ON variantes_producto(talla_id);
CREATE INDEX idx_variantes_color ON variantes_producto(color_id);

-- 3) imagenes_producto: color -> color_id ----------------------------------
ALTER TABLE imagenes_producto ADD COLUMN color_id INT NULL;

UPDATE imagenes_producto ip
JOIN colores c ON c.nombre = ip.color
SET ip.color_id = c.id
WHERE ip.color IS NOT NULL;

ALTER TABLE imagenes_producto ADD CONSTRAINT fk_imagenes_color FOREIGN KEY (color_id) REFERENCES colores(id);
ALTER TABLE imagenes_producto CHANGE COLUMN color color_legacy VARCHAR(50) NULL;

CREATE INDEX idx_imagenes_color ON imagenes_producto(color_id);

-- 4) carrito: talla/color -> talla_id/color_id -----------------------------
ALTER TABLE carrito ADD COLUMN talla_id INT NULL;
ALTER TABLE carrito ADD COLUMN color_id INT NULL;

UPDATE carrito ca JOIN tallas t ON t.nombre = ca.talla SET ca.talla_id = t.id WHERE ca.talla IS NOT NULL;
UPDATE carrito ca JOIN colores c ON c.nombre = ca.color SET ca.color_id = c.id WHERE ca.color IS NOT NULL;

ALTER TABLE carrito ADD CONSTRAINT fk_carrito_talla FOREIGN KEY (talla_id) REFERENCES tallas(id);
ALTER TABLE carrito ADD CONSTRAINT fk_carrito_color FOREIGN KEY (color_id) REFERENCES colores(id);

ALTER TABLE carrito CHANGE COLUMN talla talla_legacy VARCHAR(20) NULL;
ALTER TABLE carrito CHANGE COLUMN color color_legacy VARCHAR(50) NULL;

CREATE INDEX idx_carrito_talla ON carrito(talla_id);
CREATE INDEX idx_carrito_color ON carrito(color_id);

-- 5) productos.tallas / productos.colores ----------------------------------
-- Estas dos columnas eran 100% redundantes: un resumen (JSON/CSV) de algo
-- que ya vive en variantes_producto. A diferencia de los *_legacy de
-- arriba (que son respaldo de texto escrito por usuarios/admins), esto es
-- puro derivado generado por la propia app — se puede borrar sin perder
-- ninguna información real.
ALTER TABLE productos DROP COLUMN tallas;
ALTER TABLE productos DROP COLUMN colores;
