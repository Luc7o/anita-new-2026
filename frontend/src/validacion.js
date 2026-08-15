// Filtros reutilizables para inputs de formularios: se usan en el onChange
// para impedir que el usuario escriba caracteres que no corresponden al campo.

// Nombres, apellidos, titulares, ciudades: solo letras (con tildes/ñ) y espacios
export function soloTexto(valor) {
  return valor.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s'-]/g, "");
}

// Teléfonos: solo dígitos, máximo 9 (celulares en Perú)
export function soloNumeros(valor, maxLength = 9) {
  return valor.replace(/\D/g, "").slice(0, maxLength);
}

// RUC peruano: solo dígitos, 11 caracteres
export function soloRuc(valor) {
  return soloNumeros(valor, 11);
}

// DNI peruano: solo dígitos, 8 caracteres
export function soloDni(valor) {
  return soloNumeros(valor, 8);
}

// Carné de Extranjería: letras y números, hasta 15 caracteres
export function soloCarnetExtranjeria(valor) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
}

// SKU / códigos: letras, números y guiones, en mayúsculas
export function soloCodigo(valor) {
  return valor.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
