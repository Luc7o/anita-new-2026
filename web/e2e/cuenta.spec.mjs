// Mi cuenta, páginas informativas y aviso de privacidad.
import { test, expect } from "@playwright/test";
import { prepararBase, ingresar, rechazarCookies } from "./ayudas.mjs";

let datos;
test.beforeEach(() => {
  datos = prepararBase();
});

test("Mi cuenta: sin sesión manda a ingresar y vuelve a la misma página", async ({ page }) => {
  await rechazarCookies(page);
  await page.goto("/perfil/configuracion");
  await expect(page).toHaveURL(/\/ingresar\?volver=%2Fperfil%2Fconfiguracion/);
  await page.getByLabel("Correo electrónico").fill(datos.clientes[0]);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(datos.clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/perfil\/configuracion$/);
  await expect(page.getByRole("heading", { name: "Verificación en dos pasos" })).toBeVisible();
});

test("Mi cuenta: perfil, pedidos vacíos y cerrar sesión", async ({ page }) => {
  await ingresar(page, datos.clientes[0], datos.clave);
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Mi Cuenta" })).toBeVisible();
  await expect(page.getByText(datos.clientes[0]).first()).toBeVisible();

  await page.getByRole("navigation", { name: "Mi cuenta" }).getByRole("link", { name: "Pedidos" }).click();
  await expect(page.getByText("Todavía no tienes pedidos.")).toBeVisible();

  await page.goto("/perfil/configuracion");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.getByText("Cerraste sesión")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
});

test("páginas informativas y legales", async ({ page }) => {
  await rechazarCookies(page);
  for (const [ruta, titulo] of [
    ["/faq", "Preguntas Frecuentes"],
    ["/formas-de-pago", "Formas de Pago"],
    ["/terminos-y-condiciones", "Términos y condiciones"],
    ["/politica-de-privacidad", "Política de privacidad"],
    ["/libro-reclamaciones", "Libro de Reclamaciones"],
  ]) {
    await page.goto(ruta);
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
  }
});

test("aviso de privacidad: rechazar no crea ningún identificador", async ({ page }) => {
  await page.goto("/faq");
  const aviso = page.getByRole("region", { name: "Tu privacidad y cookies" });
  await aviso.getByRole("button", { name: "Rechazar" }).click();
  await expect(aviso).toBeHidden();
  const guardado = await page.evaluate(() => ({
    decision: JSON.parse(localStorage.getItem("ans_consentimiento") || "null"),
    id: localStorage.getItem("ans_sesion_analitica"),
  }));
  expect(guardado.decision?.analitica).toBe(false);
  expect(guardado.id).toBeNull();
});
