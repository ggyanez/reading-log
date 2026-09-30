// Applies db/schema.sql to the database in TURSO_DATABASE_URL. Every
// statement is idempotent, so it's safe to re-run.
//
//   node --env-file=.env.local db/apply-schema.mjs
import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
await db.executeMultiple(schema);
console.log(`Schema applied to ${url}`);
