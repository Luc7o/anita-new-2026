// Ingreso y registro (en modo web los sirve la app nueva; en modo SPA, la tienda actual).
import { test, expect } from "@playwright/test";
import { prepararBase, rechazarCookies } from "./ayudas.mjs";

const APP_NUEVA = process.env.E2E_APP === "web";

let datos;
test.beforeEach(async ({ page }) => {
  datos = prepararBase();
  await rechazarCookies(page);
});

test("contraseña incorrecta: avisa y no abre sesión", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo electrónico").fill(datos.clientes[0]);
  await page.getByRole("textbox", { name: "Contraseña" }).fill("no-es-la-clave");
  await page.getByRole("button", { name: "Ingresar" }).click();
  // (Next agrega su propio role=alert vacío para anunciar rutas: se filtra por texto.)
  await expect(page.getByRole("alert").filter({ hasText: "Email o contraseña incorrectos" })).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);
});

test("después de ingresar vuelve a la página de ?volver=", async ({ page }) => {
  await page.goto("/ingresar?volver=/carrito");
  await page.getByLabel("Correo electrónico").fill(datos.clientes[0]);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(datos.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/carrito$/);
});

test("registro solo con el correo: abre sesión y la cabecera la reconoce", async ({ page }) => {
  test.skip(!APP_NUEVA, "La cabecera con la sesión es de la app nueva");
  await page.goto("/registro");
  const crear = page.getByRole("button", { name: "Crear Cuenta" });
  await expect(crear).toBeDisabled(); // sin aceptar los términos no se crea nada
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByLabel("Correo electrónico").fill(`nueva.${Date.now()}@example.com`);
  await crear.click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.getByRole("link", { name: /Hola,|Mi cuenta/ })).toBeVisible();
});
