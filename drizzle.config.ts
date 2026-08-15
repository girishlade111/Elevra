import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env so that DATABASE_URL is available when running CLI commands
// (drizzle-kit runs outside Next.js so it doesn't auto-load .env)
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "[drizzle-kit] DATABASE_URL is required. Set it in .env or .env.local.\n" +
      "See .env.example for the expected format."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
  // Verbose output during migrations
  verbose: true,
  // Strict mode — prevents accidental data loss
  strict: true,
});
