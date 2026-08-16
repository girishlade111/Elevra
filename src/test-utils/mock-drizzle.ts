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
            const results = await executeSelect(store, targetTable, whereClause, limitCount, orderDesc);
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

function extractAllParams(clause: any): string[] {
  if (!clause) return [];
  const params: string[] = [];

  function walk(node: any) {
    if (!node) return;
    if (typeof node === "string") {
      params.push(node);
      return;
    }
    if (node.value !== undefined) {
      if (typeof node.value === "string") {
        params.push(node.value);
      } else if (node.value && typeof node.value === "object") {
        walk(node.value);
      }
    }
    if (node.right !== undefined) {
      if (typeof node.right === "string") {
        params.push(node.right);
      } else {
        walk(node.right);
      }
    }
    if (node.queryChunks && Array.isArray(node.queryChunks)) {
      for (const chunk of node.queryChunks) {
        walk(chunk);
      }
    }
  }

  walk(clause);
  return params;
}

function extractUserId(clause: any): string | null {
  const params = extractAllParams(clause);
  return params[0] || null;
}

async function executeSelect(
  store: MockRepositoryStore,
  table: any,
  clause: any,
  limit: number | null,
  orderDesc = false
): Promise<any[]> {
  const tableName = resolveTableName(table);
  const params = extractAllParams(clause);

  if (tableName.includes("profiles")) {
    const isCompletedFilter = clause && JSON.stringify(clause).includes("onboardingCompleted");
    if (isCompletedFilter) {
      return await store.listOnboardedProfiles();
    }
    if (params.length > 0) {
      const p = await store.getProfile(params[0]);
      return p ? [p] : [];
    }
    return Array.from(store.store.profiles.values());
  }

  if (tableName.includes("conversations")) {
    let convs = Array.from(store.store.conversations.values());
    if (params.length === 1) {
      const p = params[0];
      convs = convs.filter((c) => c.clerkUserId === p || c.id === p);
    } else if (params.length >= 2) {
      convs = convs.filter((c) => params.includes(c.id) && params.includes(c.clerkUserId));
    }
    if (limit !== null) {
      convs = convs.slice(0, limit);
    }
    return convs;
  }

  if (tableName.includes("conversation_messages") || tableName.includes("messages")) {
    let msgs = Array.from(store.store.messages.values());
    if (params.length === 1) {
      msgs = msgs.filter((m) => m.conversationId === params[0] || m.clerkUserId === params[0]);
    } else if (params.length >= 2) {
      msgs = msgs.filter((m) => params.includes(m.conversationId) && params.includes(m.clerkUserId));
    }
    if (orderDesc) {
      msgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    if (limit !== null) {
      msgs = msgs.slice(0, limit);
    }
    return msgs;
  }

  if (tableName.includes("email_preferences")) {
    if (params.length > 0) {
      const pref = await store.getEmailPreference(params[0]);
      return pref ? [pref] : [];
    }
    return Array.from(store.store.emailPreferences.values());
  }

  if (tableName.includes("gmail_connections") || tableName.includes("email_connections")) {
    if (params.length > 0) {
      const conn = await store.getEmailConnection(params[0]);
      return conn ? [conn] : [];
    }
    return Array.from(store.store.emailConnections.values());
  }

  if (tableName.includes("weekly_checkins")) {
    let checkins = Array.from(store.store.weeklyCheckins.values());
    if (params.length > 0) {
      checkins = checkins.filter((c) => params.includes(c.clerkUserId) || params.includes(c.id));
    }
    if (orderDesc) {
      checkins.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      checkins.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
    if (limit !== null) {
      checkins = checkins.slice(0, limit);
    }
    return checkins;
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
  const params = extractAllParams(clause);

  if (tableName.includes("profiles") && params[0]) {
    await store.deleteProfile(params[0]);
  }
  if (tableName.includes("conversations")) {
    if (params.length === 1) {
      await store.clearAllConversations(params[0]);
    } else if (params.length >= 2) {
      const convId = params.find((p) => store.store.conversations.has(p));
      const userId = params.find((p) => p !== convId);
      if (convId && userId) {
        await store.deleteConversation(convId, userId);
      }
    }
  }
  if (tableName.includes("gmail_connections") && params[0]) {
    await store.deleteEmailConnection(params[0]);
  }
  return { rowCount: 1 };
}
