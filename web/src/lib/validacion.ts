// Filtros para inputs: impiden escribir
// caracteres que no corresponden al campo.
export const soloTexto = (v: string) => v.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d1\s'-]/g, "");
export const soloNumeros = (v: string, max = 9) => v.replace(/\D/g, "").slice(0, max);
export const soloDni = (v: string) => soloNumeros(v, 8);
export const soloRuc = (v: string) => soloNumeros(v, 11);
export const soloDireccion = (v: string) => v.replace(/[^A-Za-zÀ-ÿ\u00f1\u00d10-9\s.*°#]/g, "");
