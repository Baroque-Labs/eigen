// Lazy Postgres client. Construction is deferred so the dev server and
// build can run without DATABASE_URL set — only routes that actually
// touch the database will fail at request time. Tests / scripts can
// override by importing `createDb` directly.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | undefined;

export function createDb(connectionString: string): Database {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export function getDb(): Database {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  cached = createDb(url);
  return cached;
}

export { schema };
