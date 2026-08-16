/**
 * @fileoverview Mock Drizzle ORM database adapter for in-memory testing.
 * Provides fluent chainable `.select()`, `.insert()`, `.update()`, `.delete()`
 * backed by `MockRepositoryStore`.
 */
import { MockRepositoryStore, mockStore } from "./test-mock-db";
import { setTestDb } from "@/db";

export function setupTestDatabase(store: MockRepositoryStore = mockStore) {
  const mockDb: any = {
    select: (fields?: any) => {
      let targetTable: any = null;
      let whereClause: any = null;
      let limitCount: number | null = null;
      let orderDesc = false;

      const chain = {
        from: (table: any) => {
          targetTable = table;
          return chain;
        },
        where: (clause: any) => {
          whereClause = clause;
          return chain;
        },
        orderBy: (...args: any[]) => {
          orderDesc = true;
          return chain;
        },
        limit: (count: number) => {
          limitCount = count;
          return chain;
        },
        then: async (resolve: any, reject?: any) => {
          try {
            const results = await executeSelect(store, targetTable, whereClause, limitCount);
            return resolve(results);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };
      return chain;
    },

    insert: (table: any) => {
      let valuesToInsert: any = null;
      const chain = {
        values: (vals: any) => {
          valuesToInsert = vals;
          return chain;
        },
        returning: async () => {
          return await executeInsert(store, table, valuesToInsert);
        },
        then: async (resolve: any, reject?: any) => {
          try {
            const res = await executeInsert(store, table, valuesToInsert);
            return resolve(res);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };
      return chain;
    },

    update: (table: any) => {
      let setVals: any = null;
      let whereClause: any = null;
      const chain = {
        set: (vals: any) => {
          setVals = vals;
          return chain;
        },
        where: (clause: any) => {
          whereClause = clause;
          return chain;
        },
        returning: async () => {
          return await executeUpdate(store, table, setVals, whereClause);
        },
        then: async (resolve: any, reject?: any) => {
          try {
            const res = await executeUpdate(store, table, setVals, whereClause);
            return resolve(res);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };
      return chain;
    },

    delete: (table: any) => {
      let whereClause: any = null;
      const chain = {
        where: (clause: any) => {
          whereClause = clause;
          return chain;
        },
        then: async (resolve: any, reject?: any) => {
          try {
            const res = await executeDelete(store, table, whereClause);
            return resolve(res);
          } catch (err) {
            if (reject) return reject(err);
            throw err;
          }
        },
      };
      return chain;
    },
  };

  setTestDb(mockDb);
  return mockDb;
}

function resolveTableName(table: any): string {
  if (!table) return "unknown";
  if (typeof table === "string") return table;
  if (table[Symbol.for("drizzle:BaseName")]) return String(table[Symbol.for("drizzle:BaseName")]);
  if (table[Symbol.for("drizzle:Name")]) return String(table[Symbol.for("drizzle:Name")]);
  if (table._?.name) return String(table._.name);
  if (table.name && typeof table.name === "string") return table.name;
  return "unknown";
}

function extractUserId(clause: any): string | null {
  if (!clause) return null;
  if (clause.value !== undefined && typeof clause.value === "string") return clause.value;
  if (clause.right !== undefined && typeof clause.right === "string") return clause.right;
  if (clause.queryChunks && Array.isArray(clause.queryChunks)) {
    for (const chunk of clause.queryChunks) {
      if (chunk && typeof chunk.value === "string") return chunk.value;
      if (chunk && chunk.brand !== undefined && typeof chunk.value === "string") return chunk.value;
      if (chunk && chunk.value && typeof chunk.value === "object" && typeof chunk.value.value === "string") {
        return chunk.value.value;
      }
    }
  }
  return null;
}

async function executeSelect(
  store: MockRepositoryStore,
  table: any,
  clause: any,
  limit: number | null
): Promise<any[]> {
  const tableName = resolveTableName(table);

  if (tableName.includes("profiles")) {
    const userId = extractUserId(clause);
    if (userId) {
      const p = await store.getProfile(userId);
      return p ? [p] : [];
    }
    return Array.from(store.store.profiles.values());
  }

  if (tableName.includes("conversations")) {
    const userId = extractUserId(clause);
    if (userId) {
      return Array.from(store.store.conversations.values()).filter((c) => c.clerkUserId === userId);
    }
    return Array.from(store.store.conversations.values());
  }

  if (tableName.includes("conversation_messages") || tableName.includes("messages")) {
    return Array.from(store.store.messages.values());
  }

  if (tableName.includes("email_preferences")) {
    const userId = extractUserId(clause);
    if (userId) {
      const pref = await store.getEmailPreference(userId);
      return pref ? [pref] : [];
    }
    return Array.from(store.store.emailPreferences.values());
  }

  if (tableName.includes("gmail_connections") || tableName.includes("email_connections")) {
    const userId = extractUserId(clause);
    if (userId) {
      const conn = await store.getEmailConnection(userId);
      return conn ? [conn] : [];
    }
    return Array.from(store.store.emailConnections.values());
  }

  if (tableName.includes("weekly_checkins")) {
    return Array.from(store.store.weeklyCheckins.values());
  }

  if (tableName.includes("ai_usage")) {
    return store.store.aiUsage;
  }

  return [];
}

async function executeInsert(store: MockRepositoryStore, table: any, values: any): Promise<any[]> {
  const tableName = resolveTableName(table);
  const item = Array.isArray(values) ? values[0] : values;

  if (tableName.includes("profiles")) {
    const created = await store.upsertProfile(item.clerkUserId, item);
    return [created];
  }

  if (tableName.includes("conversations")) {
    const created = await store.createConversation(item.clerkUserId, item.title);
    return [created];
  }

  if (tableName.includes("conversation_messages") || tableName.includes("messages")) {
    const created = await store.createMessage(item);
    return [created];
  }

  if (tableName.includes("weekly_checkins")) {
    const created = await store.createCheckin(item);
    return [created];
  }

  if (tableName.includes("gmail_connections") || tableName.includes("email_connections")) {
    const created = await store.upsertEmailConnection(item.clerkUserId, item);
    return [created];
  }

  if (tableName.includes("email_preferences")) {
    const created = await store.upsertEmailPreference(item.clerkUserId, item);
    return [created];
  }

  if (tableName.includes("ai_usage")) {
    const created = await store.recordUsage(item);
    return [created];
  }

  return [item];
}

async function executeUpdate(
  store: MockRepositoryStore,
  table: any,
  setVals: any,
  clause: any
): Promise<any[]> {
  const tableName = resolveTableName(table);
  const userId = extractUserId(clause);

  if (tableName.includes("profiles") && userId) {
    const existing = await store.getProfile(userId);
    if (!existing) return [];
    const updated = await store.upsertProfile(userId, { ...existing, ...setVals });
    return [updated];
  }

  if (tableName.includes("email_preferences") && userId) {
    const updated = await store.upsertEmailPreference(userId, setVals);
    return [updated];
  }

  return [setVals];
}

async function executeDelete(store: MockRepositoryStore, table: any, clause: any): Promise<any> {
  const tableName = resolveTableName(table);
  const userId = extractUserId(clause);

  if (tableName.includes("profiles") && userId) {
    await store.deleteProfile(userId);
  }
  if (tableName.includes("conversations") && userId) {
    await store.clearAllConversations(userId);
  }
  if (tableName.includes("gmail_connections") && userId) {
    await store.deleteEmailConnection(userId);
  }
  return { rowCount: 1 };
}
