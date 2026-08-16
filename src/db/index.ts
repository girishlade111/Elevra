/**
 * @fileoverview Production Neon PostgreSQL client using Drizzle ORM.
 *
 * Uses the neon-http adapter which is optimised for serverless environments
 * (Vercel Edge, Vercel Functions, Next.js API routes).
 *
 * The connection is instantiated lazily on first use so that the module can
 * be imported at the top level without crashing during the Next.js build step
 * when DATABASE_URL is not set.
 *
 * @server-only — this file MUST NOT be imported from client components.
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema/index";

// Re-export schema so callers can import from "@/db"
export { schema };

// ---------------------------------------------------------------------------
// Lazy singleton
// ---------------------------------------------------------------------------

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns the Drizzle database instance.
 *
 * Throws `Error` when `DATABASE_URL` is not set so that repository calls fail
 * loudly rather than silently reading undefined.
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "[db] DATABASE_URL is not set. " +
        "Set it in .env (see .env.example) and run `npm run db:migrate` before starting the app."
    );
  }

  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

export function setTestDb(mockDb: ReturnType<typeof drizzle<typeof schema>> | null): void {
  _db = mockDb;
}

/**
 * Typed alias — use this in repository files for clarity.
 */
export type Db = ReturnType<typeof getDb>;

/**
 * Database type alias (for external use via "@/db").
 */
export type Database = Db;

