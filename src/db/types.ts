/**
 * @fileoverview Database type aliases shared across the db layer.
 * @server-only
 */
import type { drizzle } from "drizzle-orm/neon-http";
import type * as schema from "./schema/index";

export type Database = ReturnType<typeof drizzle<typeof schema>>;
