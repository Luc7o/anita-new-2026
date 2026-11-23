// Pruebas de punta a punta de la tienda: backend Flask real + base PostgreSQL
// local desechable + Culqi simulado (no se usa ninguna clave real).
//
// Una sola vez: una base PostgreSQL local vacía llamada anita_e2e, por ejemplo
//   docker run -d --name anita-e2e-db -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16-alpine
//   (y luego: createdb -h localhost -p 54329 -U postgres anita_e2e)
//   npx playwright install chromium
//
// Correr (desde frontend/):  npm run e2e          → la tienda actual (SPA)
//                           npm run e2e:web      → la app nueva (web/, Next) delante de la SPA
// Otra base u otro Python:   E2E_DATABASE_URL=...  E2E_PYTHON=...
// Cada prueba vacía la base y carga su propio catálogo (e2e/servidor/preparar_base.py).
import { defineConfig, devices } from "@playwright/test";

const PY = process.env.E2E_PYTHON || "../backend/venv/Scripts/python.exe";
const API = "http://127.0.0.1:5055";
const SPA = "http://127.0.0.1:5175";
// E2E_APP=web: las pruebas entran por la app nueva, que sirve catálogo, carrito y checkout
// y deja lo demás (ingresar, detalle del pedido) a la SPA, igual que en producción.
const WEB = process.env.E2E_APP === "web";
const TIENDA = WEB ? "http://127.0.0.1:3000" : SPA;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // todas comparten una base: una a la vez
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: TIENDA,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-PE",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `"${PY}" e2e/servidor/api.py`,
      url: `${API}/api/salud`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npx vite --host 127.0.0.1 --port 5175 --strictPort",
      url: SPA,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_URL: `${API}/api`,
        VITE_CULQI_PUBLIC_KEY: "pk_test_e2e",
        VITE_GOOGLE_CLIENT_ID: "",
      },
    },
    ...(WEB
      ? [
          {
            command: "npx next dev --hostname 127.0.0.1 --port 3000",
            cwd: "../web",
            url: `${TIENDA}/tienda`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: {
              DATABASE_URL: process.env.E2E_DATABASE_URL || "postgresql://postgres:test@localhost:54329/anita_e2e",
              NEXT_PUBLIC_API_URL: `${API}/api`,
              NEXT_PUBLIC_TIENDA_URL: TIENDA,
              NEXT_PUBLIC_CULQI_PUBLIC_KEY: "pk_test_e2e",
              SPA_ORIGEN: SPA,
            },
          },
        ]
      : []),
  ],
});
