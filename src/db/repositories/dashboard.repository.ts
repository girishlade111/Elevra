/**
 * @fileoverview Dashboard & Progress analytics repository.
 * Aggregates real metrics derived purely from Neon DB.
 * Never invents fake percentages, fake AI scores, or placeholder analytics.
 * @server-only
 */
import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { conversations, conversationMessages } from "@/db/schema/coaching";
import { weeklyCheckins } from "@/db/schema/emails";
import { getProfile } from "./profile.repository";
import { listConversationsWithDetails, type ConversationWithDetails } from "./conversation.repository";
import { getEmailPreference } from "./email-preference.repository";
import { getLastCheckin } from "./weekly-checkin.repository";
import { getUsageSummary, type UsageSummary } from "./ai-usage.repository";
import type { Profile } from "@/db/schema/users";
import type { EmailPreference, WeeklyCheckin } from "@/db/schema/emails";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardMetrics {
  profile: Profile | null;
  emailPreference: EmailPreference | null;
  lastCheckin: WeeklyCheckin | null;
  recentConversations: ConversationWithDetails[];
  recentIntents: string[];
  conversationsThisMonth: number;
  messagesThisMonth: number;
  totalCheckinsSent: number;
  latestConversationId: string | null;
}

export interface IntentDistributionItem {
  intent: string;
  count: number;
  percentage: number;
}

export interface ProgressMetrics {
  profile: Profile | null;
  totalConversations: number;
  totalMessages: number;
  conversationsThisMonth: number;
  messagesThisMonth: number;
  usageSummary: UsageSummary;
  intentDistribution: IntentDistributionItem[];
  recentConversations: ConversationWithDetails[];
  totalCheckinsSent: number;
  lastCheckin: WeeklyCheckin | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Loads all authenticated dashboard metrics from real DB records for the user.
 */
export async function getDashboardData(clerkUserId: string): Promise<DashboardMetrics> {
  const db = getDb();
  const startOfMonth = getStartOfMonth();

  // Run independent queries concurrently
  const [
    profile,
    emailPref,
    recentConvs,
    lastCheckin,
    convsThisMonthRows,
    msgsThisMonthRows,
    checkinsSentRows,
  ] = await Promise.all([
    getProfile(clerkUserId),
    getEmailPreference(clerkUserId),
    listConversationsWithDetails(clerkUserId, 5),
    getLastCheckin(clerkUserId),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.clerkUserId, clerkUserId),
          gte(conversations.createdAt, startOfMonth)
        )
      ),
    db
      .select({ id: conversationMessages.id })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.clerkUserId, clerkUserId),
          gte(conversationMessages.createdAt, startOfMonth)
        )
      ),
    db
      .select({ id: weeklyCheckins.id })
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.clerkUserId, clerkUserId),
          eq(weeklyCheckins.status, "sent")
        )
      ),
  ]);

  // Extract recent unique intents
  const recentIntentsSet = new Set<string>();
  for (const conv of recentConvs) {
    if (conv.lastIntent) {
      recentIntentsSet.add(conv.lastIntent);
    }
  }

  const latestConversationId = recentConvs.length > 0 ? recentConvs[0]?.id ?? null : null;

  return {
    profile,
    emailPreference: emailPref,
    lastCheckin,
    recentConversations: recentConvs,
    recentIntents: Array.from(recentIntentsSet),
    conversationsThisMonth: convsThisMonthRows.length,
    messagesThisMonth: msgsThisMonthRows.length,
    totalCheckinsSent: checkinsSentRows.length,
    latestConversationId,
  };
}

/**
 * Computes strictly real progress metrics derived from conversations, messages, and AI usage.
 */
export async function getProgressData(clerkUserId: string): Promise<ProgressMetrics> {
  const db = getDb();
  const startOfMonth = getStartOfMonth();

  const [
    profile,
    recentConvs,
    totalConvsRows,
    totalMsgsRows,
    convsThisMonthRows,
    msgsThisMonthRows,
    usageSummary,
    allMessagesWithIntent,
    checkinsSentRows,
    lastCheckin,
  ] = await Promise.all([
    getProfile(clerkUserId),
    listConversationsWithDetails(clerkUserId, 20),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.clerkUserId, clerkUserId)),
    db
      .select({ id: conversationMessages.id })
      .from(conversationMessages)
      .where(eq(conversationMessages.clerkUserId, clerkUserId)),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.clerkUserId, clerkUserId),
          gte(conversations.createdAt, startOfMonth)
        )
      ),
    db
      .select({ id: conversationMessages.id })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.clerkUserId, clerkUserId),
          gte(conversationMessages.createdAt, startOfMonth)
        )
      ),
    getUsageSummary(clerkUserId),
    db
      .select({ intent: conversationMessages.intent })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.clerkUserId, clerkUserId),
          sql`${conversationMessages.intent} IS NOT NULL`
        )
      ),
    db
      .select({ id: weeklyCheckins.id })
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.clerkUserId, clerkUserId),
          eq(weeklyCheckins.status, "sent")
        )
      ),
    getLastCheckin(clerkUserId),
  ]);

  // Aggregate real intent distribution
  const intentCounts = new Map<string, number>();
  let totalIntentsCounted = 0;

  for (const row of allMessagesWithIntent) {
    if (row.intent) {
      intentCounts.set(row.intent, (intentCounts.get(row.intent) || 0) + 1);
      totalIntentsCounted++;
    }
  }

  // Also include intents from conversations if messages intent is sparse
  if (totalIntentsCounted === 0) {
    for (const conv of recentConvs) {
      if (conv.lastIntent) {
        intentCounts.set(conv.lastIntent, (intentCounts.get(conv.lastIntent) || 0) + 1);
        totalIntentsCounted++;
      }
    }
  }

  const intentDistribution: IntentDistributionItem[] = Array.from(intentCounts.entries())
    .map(([intent, count]) => ({
      intent,
      count,
      percentage: totalIntentsCounted > 0 ? Math.round((count / totalIntentsCounted) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    profile,
    totalConversations: totalConvsRows.length,
    totalMessages: totalMsgsRows.length,
    conversationsThisMonth: convsThisMonthRows.length,
    messagesThisMonth: msgsThisMonthRows.length,
    usageSummary,
    intentDistribution,
    recentConversations: recentConvs,
    totalCheckinsSent: checkinsSentRows.length,
    lastCheckin,
  };
}
