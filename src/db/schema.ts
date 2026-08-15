/**
 * Flat schema re-export for drizzle-kit config.
 * This file intentionally mirrors src/db/schema/index.ts so that both
 * the app code (import from "@/db/schema") and drizzle.config.ts point
 * at the same source of truth.
 * @server-only
 */
export * from "./schema/index";
