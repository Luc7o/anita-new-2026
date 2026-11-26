// Ingreso y registro.
import { test, expect } from "@playwright/test";
import { prepararBase, rechazarCookies } from "./ayudas.mjs";

let datos;
test.beforeEach(async ({ page }) => {
  datos = prepararBase();
  await rechazarCookies(page);
});

test("contraseña incorrecta: avisa y no abre sesión", async ({ page }) => {
  await page.goto("/ingresar");
  await expect(page.getByRole("button", { name: "Ingresar" })).toBeDisabled(); // sin aceptar los términos no se ingresa
  await page.getByLabel("Correo electrónico").fill(datos.clientes[0]);
  await page.getByRole("textbox", { name: "Contraseña" }).fill("no-es-la-clave");
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Ingresar" }).click();
  // (Next agrega su propio role=alert vacío para anunciar rutas: se filtra por texto.)
  await expect(page.getByRole("alert").filter({ hasText: "Email o contraseña incorrectos" })).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);
});

test("después de ingresar vuelve a la página de ?volver=", async ({ page }) => {
  await page.goto("/ingresar?volver=/carrito");
  await page.getByLabel("Correo electrónico").fill(datos.clientes[0]);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(datos.clave);
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/carrito$/);
});

test("registro solo con el correo: abre sesión y la cabecera la reconoce", async ({ page }) => {
  await page.goto("/registro");
  const crear = page.getByRole("button", { name: "Crear Cuenta" });
  await expect(crear).toBeDisabled(); // sin aceptar los términos no se crea nada
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByLabel("Correo electrónico").fill(`nueva.${Date.now()}@example.com`);
  await crear.click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.getByRole("link", { name: /Hola,|Mi cuenta/ })).toBeVisible();
});
