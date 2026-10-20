// Evalúa qué tan segura es una contraseña y qué le falta. Solo es una ayuda
// visual: la regla real (que el servidor exige) es el largo mínimo.

export const NIVELES = {
  0: { etiqueta: "", barras: 0 },
  1: { etiqueta: "Muy débil", barras: 1, barra: "bg-red-500", texto: "text-red-600" },
  2: { etiqueta: "Débil", barras: 2, barra: "bg-orange-500", texto: "text-orange-600" },
  3: { etiqueta: "Buena", barras: 3, barra: "bg-yellow-500", texto: "text-yellow-700" },
  4: { etiqueta: "Fuerte", barras: 4, barra: "bg-green-600", texto: "text-green-700" },
};

const COMUNES = [
  "123456", "1234567", "12345678", "123456789", "1234567890", "12345", "654321", "987654321",
  "111111", "000000", "123123", "123321", "password", "contrasena", "contraseña", "qwerty",
  "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbnm", "abc123", "iloveyou", "admin", "letmein",
  "welcome", "anita", "anitanewstyle", "peru", "huancayo", "te quiero", "tequiero",
];

const esSecuencia = (s) => {
  if (s.length < 4) return false;
  const pasos = [...s].slice(1).map((c, i) => c.charCodeAt(0) - s.charCodeAt(i));
  return pasos.every((p) => p === 1) || pasos.every((p) => p === -1);
};

export function evaluarPassword(pw, minimo = 6) {
  const longitud = pw.length;
  if (longitud === 0) return { nivel: 0, sugerencias: [], cumpleMinimo: false };

  const tiene = {
    minuscula: /[a-zñáéíóúü]/.test(pw),
    mayuscula: /[A-ZÑÁÉÍÓÚÜ]/.test(pw),
    numero: /\d/.test(pw),
    simbolo: /[^A-Za-z0-9ñÑáéíóúüÁÉÍÓÚÜ\s]/.test(pw),
  };
  const tipos = Object.values(tiene).filter(Boolean).length;
  const minusculas = pw.toLowerCase();
  const base = minusculas.replace(/[\d\W_]+$/, ""); // "password123!" -> "password"
  const comun =
    COMUNES.includes(minusculas) || (base.length >= 4 && COMUNES.includes(base) && longitud <= base.length + 4);
  const repetida = /^(.)\1+$/.test(pw);
  const secuencia = esSecuencia(minusculas);
  const cumpleMinimo = longitud >= minimo;

  // Nivel
  let nivel;
  if (!cumpleMinimo || comun || repetida || secuencia) {
    nivel = 1;
  } else {
    const puntos =
      (longitud >= 8 ? 1 : 0) + (longitud >= 12 ? 1 : 0) + (tipos >= 2 ? 1 : 0) + (tipos >= 3 ? 1 : 0) + (tipos >= 4 ? 1 : 0);
    nivel = puntos <= 1 ? 2 : puntos <= 3 ? 3 : 4;
  }

  // Sugerencias, de la más importante a la menos
  const sugerencias = [];
  if (!cumpleMinimo) {
    const falta = minimo - longitud;
    sugerencias.push(falta === 1 ? `Te falta 1 carácter para llegar al mínimo de ${minimo}.` : `Te faltan ${falta} caracteres para llegar al mínimo de ${minimo}.`);
  }
  if (comun) sugerencias.push("Es muy fácil de adivinar. Evita claves comunes como 123456, password o el nombre de la tienda.");
  else if (repetida) sugerencias.push("Evita repetir siempre el mismo carácter.");
  else if (secuencia) sugerencias.push("Evita secuencias como 1234 o abcd.");
  if (cumpleMinimo && longitud < 8) sugerencias.push("Usa 8 o más caracteres para mayor seguridad.");
  if (!tiene.mayuscula) sugerencias.push("Agrega una letra mayúscula.");
  if (!tiene.minuscula) sugerencias.push("Agrega una letra minúscula.");
  if (!tiene.numero) sugerencias.push("Agrega un número.");
  if (!tiene.simbolo) sugerencias.push("Agrega un símbolo, por ejemplo ! # $ %.");
  if (cumpleMinimo && longitud >= 8 && longitud < 12 && sugerencias.length === 0) {
    sugerencias.push("Con 12 o más caracteres será todavía más segura.");
  }

  // Máximo 3 a la vez para no abrumar; al corregir una, aparece la siguiente.
  return { nivel, sugerencias: sugerencias.slice(0, 3), cumpleMinimo };
}
