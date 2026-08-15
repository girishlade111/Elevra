import { defineConfig } from "drizzle-kit";

// Load .env files so that DATABASE_URL is available when running CLI commands.
// drizzle-kit runs outside Next.js so it doesn't auto-load .env.
const dotenvPath = ".env";
const dotenvLocalPath = ".env.local";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv") as typeof import("dotenv");
  dotenv.config({ path: dotenvPath });
  dotenv.config({ path: dotenvLocalPath, override: true });
} catch {
  // dotenv may not be available in all environments — that's fine
}

const databaseUrl = process.env.DATABASE_URL;

// For `db:generate`, DATABASE_URL is NOT required (pure schema introspection).
// For `db:migrate` and `db:studio`, DATABASE_URL IS required.
// We use a placeholder URL that will fail at connection time if not set,
// so that `drizzle-kit generate` can still work without a real DB.
const resolvedUrl =
  databaseUrl ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder?sslmode=require";

if (!databaseUrl) {
  console.warn(
    "[drizzle-kit] DATABASE_URL is not set. " +
      "`db:generate` will work, but `db:migrate` and `db:studio` require it.\n" +
      "Set DATABASE_URL in .env or .env.local (see .env.example)."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: resolvedUrl,
  },
  // Verbose output during migrations
  verbose: true,
  // Strict mode — prevents accidental data loss
  strict: true,
});
