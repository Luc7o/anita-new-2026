-- Corrige nombres de ubigeo que se cargaron con la codificación rota en 002_datos_base.sql
-- (UTF-8 leído como Windows-1252): "SAÃ‘O" → "SAÑO", "BREÃ‘A" → "BREÑA", y una "Á" que
-- quedó como "Ã" + carácter de control U+0081. Se ven así en el selector de distrito del
-- checkout. Solo toca las filas afectadas; correrla de nuevo no cambia nada.

UPDATE ubigeo_departamentos
   SET nombre = replace(replace(nombre, 'Ã‘', 'Ñ'), 'Ã' || chr(129), 'Á')
 WHERE nombre LIKE '%Ã%';

UPDATE ubigeo_provincias
   SET nombre = replace(replace(nombre, 'Ã‘', 'Ñ'), 'Ã' || chr(129), 'Á')
 WHERE nombre LIKE '%Ã%';

UPDATE ubigeo_distritos
   SET nombre = replace(replace(nombre, 'Ã‘', 'Ñ'), 'Ã' || chr(129), 'Á')
 WHERE nombre LIKE '%Ã%';
