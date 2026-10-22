// Formato compartido por varias pantallas.

// 12.5 -> "S/ 12.50" (null/undefined/NaN cuentan como 0)
export const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

// Fecha de hoy en hora LOCAL del navegador, como "AAAA-MM-DD" (lo que espera <input type="date">).
// No usar toISOString(): devuelve la fecha en UTC y de noche en Perú ya marca el día siguiente.
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
