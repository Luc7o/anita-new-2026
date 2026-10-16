-- Conserva los datos que ya se mostraban públicamente desde
-- frontend/src/datosEmpresa.js (ciudad, horario y Facebook) al pasar a leer
-- la configuración desde la base de datos. Solo rellena lo que esté vacío,
-- así que no pisa nada que el admin ya haya editado. Teléfono, dirección y
-- correos NO se inventan: estaban vacíos en ese archivo y se llenan desde
-- el panel admin.
UPDATE configuracion_tienda SET ciudad = 'Huancayo' WHERE id = 1 AND ciudad IS NULL;
UPDATE configuracion_tienda SET horario_atencion = 'Lunes a sábado de 10:00 a.m. a 8:00 p.m.' WHERE id = 1 AND horario_atencion IS NULL;
UPDATE configuracion_tienda SET facebook_url = 'https://www.facebook.com/anitanewstyle' WHERE id = 1 AND facebook_url IS NULL;
