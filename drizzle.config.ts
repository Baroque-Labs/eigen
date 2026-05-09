import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit doesn't auto-load .env.local the way Next does at runtime.
// loadEnvConfig matches Next's loading order so DATABASE_URL resolves
// from the same place the app uses.
loadEnvConfig(process.cwd());

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
