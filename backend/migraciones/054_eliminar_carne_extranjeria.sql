-- Elimina el Carné de Extranjería (CE) como tipo de documento de identidad.
-- Los usuarios que lo tenían guardado en su perfil quedan sin documento
-- (tipo y número en NULL); pueden volver a registrar un DNI o RUC cuando
-- quieran. Los pedidos y reclamaciones ya emitidos NO se tocan: son registros
-- históricos/legales y deben conservar el documento con el que se hicieron.
-- Ejecutar con aplicar_migraciones.py (se aplica una sola vez).

UPDATE usuarios
   SET tipo_documento = NULL,
       numero_documento = NULL
 WHERE LOWER(tipo_documento) = 'ce';
