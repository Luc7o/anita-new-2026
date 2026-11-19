// Pruebas de las utilidades puras del frontend (filtros de formularios, formato, stock por
// talla/color, fuerza de contraseña, nombre visible e idempotencia del pago).
//     npm test
import test from "node:test";
import assert from "node:assert/strict";

import { soloTexto, soloNumeros, soloDni, soloRuc, soloDireccion } from "../src/validacion.js";
import { soles } from "../src/formato.js";
import { stockCombo, tallaDisponible, colorDisponible } from "../src/utils/variantes.js";
import { evaluarPassword } from "../src/utils/passwordFuerza.js";
import { esNombreProvisional, nombreVisible } from "../src/utils/nombreUsuario.js";

// ------------------------------------------------------------ filtros de formularios
test("los filtros de texto dejan letras con tildes y ñ, y quitan lo demás", () => {
  assert.equal(soloTexto("José Ñañez<script>1"), "José Ñañezscript");
  assert.equal(soloTexto("O'Higgins-Pérez"), "O'Higgins-Pérez");
});

test("teléfono, DNI y RUC: solo dígitos y largo máximo", () => {
  assert.equal(soloNumeros("987-654-321-999"), "987654321");
  assert.equal(soloDni("12a345678 9"), "12345678");
  assert.equal(soloRuc("20-123456789-01"), "20123456789");
});

test("la dirección acepta solo . * ° # además de letras y números (igual que el backend)", () => {
  assert.equal(soloDireccion("Jr. Real N° 123 #4 *esq.; <b>"), "Jr. Real N° 123 #4 *esq. b");
});

// ------------------------------------------------------------------------ formato
test("soles siempre muestra dos decimales y trata lo vacío como 0", () => {
  assert.equal(soles(12.5), "S/ 12.50");
  assert.equal(soles("7"), "S/ 7.00");
  assert.equal(soles(null), "S/ 0.00");
  assert.equal(soles(undefined), "S/ 0.00");
  assert.equal(soles(NaN), "S/ 0.00");
});

// ------------------------------------------------------------ stock por variante
const vestido = {
  usa_variantes: true,
  tallas: ["S", "M"],
  colores: ["Rojo", "Negro"],
  variantes: [
    { talla: "S", color: "Rojo", stock: 0 },
    { talla: "S", color: "Negro", stock: 2 },
    { talla: "M", color: "Rojo", stock: 1 },
  ],
};

test("stockCombo lee la combinación exacta y 0 si no existe", () => {
  assert.equal(stockCombo(vestido, "S", "Negro"), 2);
  assert.equal(stockCombo(vestido, "S", "Rojo"), 0);
  assert.equal(stockCombo(vestido, "M", "Negro"), 0);
  assert.equal(stockCombo(null, "S", "Rojo"), 0);
});

test("un producto simple usa su stock total sin importar talla o color", () => {
  assert.equal(stockCombo({ usa_variantes: false, stock: 4 }, "XL", "Azul"), 4);
  assert.equal(tallaDisponible({ usa_variantes: false }, "XL"), true);
});

test("una talla está disponible si alguna combinación tiene stock, o la exacta si ya hay color", () => {
  assert.equal(tallaDisponible(vestido, "S"), true);
  assert.equal(tallaDisponible(vestido, "S", "Rojo"), false);
  assert.equal(colorDisponible(vestido, "Negro"), true);
  assert.equal(colorDisponible(vestido, "Negro", "M"), false);
});

// ------------------------------------------------------------- fuerza de contraseña
test("las contraseñas comunes, repetidas o en secuencia son muy débiles", () => {
  for (const pw of ["123456", "password123", "aaaaaaaa", "abcdefg", "anitanewstyle"]) {
    assert.equal(evaluarPassword(pw).nivel, 1, pw);
  }
});

test("una contraseña larga y variada es fuerte; menos del mínimo no cumple", () => {
  assert.equal(evaluarPassword("Huanc4yo!Moda-2026").nivel, 4);
  const corta = evaluarPassword("Ab1!");
  assert.equal(corta.cumpleMinimo, false);
  assert.match(corta.sugerencias[0], /faltan 2 caracteres/);
  assert.ok(evaluarPassword("x").sugerencias.length <= 3);
});

// ------------------------------------------------------------------ nombre visible
test("el nombre provisional de las cuentas solo-correo no se muestra", () => {
  const invitado = { es_invitado: true, nombre: "Cliente 3FA9", email: "ana@prueba.test", nombre_completo: "Cliente 3FA9" };
  assert.equal(esNombreProvisional(invitado), true);
  assert.equal(nombreVisible(invitado), "ana@prueba.test");
  const real = { es_invitado: false, nombre: "Ana", nombre_completo: "Ana Pérez", email: "ana@prueba.test" };
  assert.equal(nombreVisible(real), "Ana Pérez");
  assert.equal(nombreVisible(null), "");
});

// ---------------------------------------------------------- idempotencia del pago
class AlmacenFalso {
  constructor() { this.d = new Map(); this.roto = false; }
  getItem(k) { if (this.roto) throw new Error("SecurityError"); return this.d.get(k) ?? null; }
  setItem(k, v) { if (this.roto) throw new Error("SecurityError"); this.d.set(k, String(v)); }
  removeItem(k) { if (this.roto) throw new Error("SecurityError"); this.d.delete(k); }
}

test("la clave de pago se reutiliza en reintentos del mismo pedido y cambia por pedido", async () => {
  globalThis.sessionStorage = new AlmacenFalso();
  const { obtenerPagoIdempotencyKey, limpiarPagoIdempotencyKey } = await import("../src/pagoIdempotencia.js");
  const primera = obtenerPagoIdempotencyKey(10);
  assert.equal(obtenerPagoIdempotencyKey(10), primera);
  assert.notEqual(obtenerPagoIdempotencyKey(11), primera);
  limpiarPagoIdempotencyKey(10);
  assert.notEqual(obtenerPagoIdempotencyKey(10), primera);
});

test("sin sessionStorage (modo privado) igual devuelve una clave válida", async () => {
  const almacen = new AlmacenFalso();
  almacen.roto = true;
  globalThis.sessionStorage = almacen;
  const { obtenerPagoIdempotencyKey, limpiarPagoIdempotencyKey } = await import("../src/pagoIdempotencia.js");
  assert.match(obtenerPagoIdempotencyKey(5), /^[0-9a-f-]{36}$/);
  assert.doesNotThrow(() => limpiarPagoIdempotencyKey(5));
});
