import { defineConfig } from "drizzle-kit";

// El esquema vive en backend/migraciones_postgres (SQL versionado, lo aplica
// backend/aplicar_migraciones.py). Mientras convivan las dos apps, esta NO crea
// tablas: `npm run db:pull` lee el esquema de una base ya migrada y regenera
// src/db/schema.ts. Usa una base LOCAL, nunca la de producción.
export default defineConfig({
  dialect: "postgresql",
  out: "./src/db/pull",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DRIZZLE_PULL_URL ?? "postgresql://postgres:test@localhost:54329/anita_e2e",
  },
  introspect: { casing: "camel" },
});
