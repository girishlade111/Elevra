import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/config/env";
import * as schema from "./schema";

/**
 * Lazy database connection instance.
 * Validates DATABASE_URL before creating client.
 */
function createDbClient() {
  const env = getServerEnv();

  if (!env.DATABASE_URL) {
    // Return null in environments where DB is not yet provisioned
    return null;
  }

  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDbClient>;

export const getDb = () => {
  return createDbClient();
};

export { schema };
