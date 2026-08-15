/**
 * @fileoverview Coaching tables:
 *   - conversations
 *   - conversation_messages
 *   - ai_usage
 *   - conversation_memory
 * @server-only
 */
import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const MESSAGE_ROLE_VALUES = ["user", "assistant", "system"] as const;
export type MessageRole = (typeof MESSAGE_ROLE_VALUES)[number];

export const INTENT_VALUES = [
  "salary",
  "interview",
  "career_change",
  "leadership",
  "confidence",
  "balance",
  "general",
] as const;
export type Intent = (typeof INTENT_VALUES)[number];

// ---------------------------------------------------------------------------
// conversations
// ---------------------------------------------------------------------------

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    title: text("title").notNull().default("New Conversation"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_clerk_user_id_idx").on(table.clerkUserId),
    index("conversations_created_at_idx").on(table.createdAt),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// ---------------------------------------------------------------------------
// conversation_messages
// ---------------------------------------------------------------------------

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(), // nanoid
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    role: text("role").$type<MessageRole>().notNull(),
    content: text("content").notNull(),
    intent: text("intent").$type<Intent>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conv_messages_conversation_id_idx").on(table.conversationId),
    index("conv_messages_clerk_user_id_idx").on(table.clerkUserId),
    index("conv_messages_created_at_idx").on(table.createdAt),
  ]
);

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;

// ---------------------------------------------------------------------------
// ai_usage
// ---------------------------------------------------------------------------

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    endpointType: text("endpoint_type").notNull(), // e.g. "coaching", "classify_intent"
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_usage_clerk_user_id_idx").on(table.clerkUserId),
    index("ai_usage_created_at_idx").on(table.createdAt),
  ]
);

export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;

// ---------------------------------------------------------------------------
// conversation_memory
// ---------------------------------------------------------------------------

export const conversationMemory = pgTable(
  "conversation_memory",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull().unique(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conv_memory_clerk_user_id_idx").on(table.clerkUserId),
  ]
);

export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type NewConversationMemory = typeof conversationMemory.$inferInsert;
