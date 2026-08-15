/**
 * @fileoverview AI usage repository — records token consumption per request.
 * @server-only
 */
import { eq, gte, sum, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { aiUsage } from "@/db/schema/coaching";
import type { AiUsage, NewAiUsage } from "@/db/schema/coaching";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecordUsageData {
  clerkUserId: string;
  endpointType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  requestCount: number;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Records a single AI call's token usage.
 */
export async function recordUsage(data: RecordUsageData): Promise<AiUsage> {
  const db = getDb();
  const now = new Date();
  const totalTokens = data.inputTokens + data.outputTokens;

  const [created] = await db
    .insert(aiUsage)
    .values({
      id: nanoid(),
      clerkUserId: data.clerkUserId,
      endpointType: data.endpointType,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens,
      createdAt: now,
    } satisfies NewAiUsage)
    .returning();

  if (!created)
    throw new Error("[ai-usage.repository] recordUsage: insert returned no rows");
  return created;
}

/**
 * Returns aggregated token counts for the given Clerk user since a given date.
 * If `since` is not provided, totals all-time usage.
 */
export async function getUsageSummary(
  clerkUserId: string,
  since?: Date
): Promise<UsageSummary> {
  const db = getDb();

  const conditions = since
    ? sql`${aiUsage.clerkUserId} = ${clerkUserId} AND ${aiUsage.createdAt} >= ${since}`
    : eq(aiUsage.clerkUserId, clerkUserId);

  const rows = await db
    .select({
      totalInputTokens: sum(aiUsage.inputTokens),
      totalOutputTokens: sum(aiUsage.outputTokens),
      totalTokens: sum(aiUsage.totalTokens),
      requestCount: sql<number>`cast(count(*) as integer)`,
    })
    .from(aiUsage)
    .where(conditions);

  const row = rows[0];

  return {
    totalInputTokens: Number(row?.totalInputTokens ?? 0),
    totalOutputTokens: Number(row?.totalOutputTokens ?? 0),
    totalTokens: Number(row?.totalTokens ?? 0),
    requestCount: Number(row?.requestCount ?? 0),
  };
}

/**
 * Lists raw usage records for the given Clerk user (for audit / admin).
 */
export async function listUsage(
  clerkUserId: string,
  limit = 100,
  since?: Date
): Promise<AiUsage[]> {
  const db = getDb();

  const whereClause = since
    ? sql`${aiUsage.clerkUserId} = ${clerkUserId} AND ${aiUsage.createdAt} >= ${since}`
    : eq(aiUsage.clerkUserId, clerkUserId);

  return db
    .select()
    .from(aiUsage)
    .where(whereClause)
    .orderBy(aiUsage.createdAt)
    .limit(limit);
}
