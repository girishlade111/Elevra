import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { StructuredCoachingResponse } from "@/types/ai";

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Coaching Session"),
  summary: text("summary"),
  lastIntent: text("last_intent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  structuredData: jsonb("structured_data").$type<StructuredCoachingResponse | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
