import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL");

// Una conexión reutilizada por instancia (en dev, también entre recargas en caliente).
// prepare:false porque el pooler de Neon (PgBouncer en modo transacción) no admite
// sentencias preparadas con nombre.
const global_ = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };
const sql = global_._sql ?? postgres(url, { max: 3, prepare: false, idle_timeout: 20 });
if (process.env.NODE_ENV !== "production") global_._sql = sql;

export const db = drizzle(sql, { schema });
