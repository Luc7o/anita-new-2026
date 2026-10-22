-- Colores: nombre con la primera letra en mayúscula ("azul" pasa a "Azul") y
-- código hexadecimal para los colores conocidos. La fila con nombre vacio se
-- queda: es el marcador de "este producto no varia por color" y las variantes lo
-- necesitan.

UPDATE colores
SET nombre = CONCAT(UPPER(LEFT(nombre, 1)), SUBSTRING(nombre, 2))
WHERE nombre <> '' AND BINARY LEFT(nombre, 1) <> BINARY UPPER(LEFT(nombre, 1));

UPDATE colores
SET codigo_hex = CASE LOWER(nombre)
        WHEN 'negro' THEN '#171717'
        WHEN 'blanco' THEN '#FFFFFF'
        WHEN 'rojo' THEN '#DC2626'
        WHEN 'guindo' THEN '#7C1D2E'
        WHEN 'vino' THEN '#7C1D2E'
        WHEN 'borgoña' THEN '#800020'
        WHEN 'borgona' THEN '#800020'
        WHEN 'azul' THEN '#2563EB'
        WHEN 'azul marino' THEN '#1E3A8A'
        WHEN 'azul rey' THEN '#1D4ED8'
        WHEN 'verde' THEN '#16A34A'
        WHEN 'verde militar' THEN '#4D5C36'
        WHEN 'verde olivo' THEN '#6B7A3A'
        WHEN 'amarillo' THEN '#EAB308'
        WHEN 'mostaza' THEN '#CA9A2E'
        WHEN 'naranja' THEN '#EA580C'
        WHEN 'rosa' THEN '#EC4899'
        WHEN 'rosa palo' THEN '#D8A6A6'
        WHEN 'morado' THEN '#9333EA'
        WHEN 'violeta' THEN '#7C3AED'
        WHEN 'gris' THEN '#6B7280'
        WHEN 'gris claro' THEN '#D1D5DB'
        WHEN 'gris oscuro' THEN '#4B5563'
        WHEN 'beige' THEN '#D6C7A1'
        WHEN 'marron' THEN '#78350F'
        WHEN 'marrón' THEN '#78350F'
        WHEN 'café' THEN '#6F4E37'
        WHEN 'camel' THEN '#C19A6B'
        WHEN 'chocolate' THEN '#4B2E1E'
        WHEN 'celeste' THEN '#38BDF8'
        WHEN 'turquesa' THEN '#14B8A6'
        WHEN 'dorado' THEN '#CA8A04'
        WHEN 'plateado' THEN '#9CA3AF'
        WHEN 'crema' THEN '#FDF6E3'
        WHEN 'fucsia' THEN '#DB2777'
        WHEN 'lila' THEN '#C4B5FD'
        WHEN 'coral' THEN '#FF6F61'
        WHEN 'khaki' THEN '#8B8355'
        WHEN 'caqui' THEN '#8B8355'
        WHEN 'ocre' THEN '#B5651D'
        ELSE NULL
    END
WHERE nombre <> '' AND codigo_hex IS NULL;
