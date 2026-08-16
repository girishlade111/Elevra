/**
 * @fileoverview In-Memory Mock Database & Repository Test Store.
 * Provides high-fidelity, deterministic in-memory storage for repository & route handler tests.
 */
import { nanoid } from "nanoid";
import type { Profile, CareerStage } from "@/db/schema/users";
import type { Conversation, ConversationMessage } from "@/db/schema/coaching";
import { encryptCredential, decryptCredential } from "@/lib/security/encryption";

if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
}

export interface InMemoryStore {
  profiles: Map<string, Profile>;
  conversations: Map<string, Conversation>;
  messages: Map<string, ConversationMessage>;
  emailConnections: Map<string, EmailConnection>;
  emailPreferences: Map<string, EmailPreference>;
  weeklyCheckins: Map<string, WeeklyCheckin>;
  aiUsage: Array<{
    id: string;
    clerkUserId: string;
    endpointType: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    createdAt: Date;
  }>;
  memory: Map<string, { id: string; clerkUserId: string; summary: string; createdAt: Date; updatedAt: Date }>;
}

export function createInMemoryStore(): InMemoryStore {
  return {
    profiles: new Map(),
    conversations: new Map(),
    messages: new Map(),
    emailConnections: new Map(),
    emailPreferences: new Map(),
    weeklyCheckins: new Map(),
    aiUsage: [],
    memory: new Map(),
  };
}

export class MockRepositoryStore {
  public store: InMemoryStore;

  constructor() {
    this.store = createInMemoryStore();
  }

  reset() {
    this.store = createInMemoryStore();
  }

  // Profile operations
  async upsertProfile(
    clerkUserId: string,
    data: {
      email: string;
      name?: string | null;
      careerStage?: CareerStage | null;
      challenge?: string | null;
      monthlyGoal?: string | null;
      onboardingStep?: number;
      onboardingCompleted?: boolean;
    }
  ): Promise<Profile> {
    const now = new Date();
    const existing = this.store.profiles.get(clerkUserId);
    if (existing) {
      const updated: Profile = {
        ...existing,
        email: data.email || existing.email,
        name: data.name !== undefined && data.name !== null ? data.name : existing.name,
        careerStage: data.careerStage !== undefined ? data.careerStage : existing.careerStage,
        challenge: data.challenge !== undefined ? data.challenge : existing.challenge,
        monthlyGoal: data.monthlyGoal !== undefined ? data.monthlyGoal : existing.monthlyGoal,
        onboardingStep: data.onboardingStep !== undefined ? data.onboardingStep : existing.onboardingStep,
        onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : existing.onboardingCompleted,
        updatedAt: now,
        lastActiveAt: now,
      };
      this.store.profiles.set(clerkUserId, updated);
      return updated;
    }

    const created: Profile = {
      id: nanoid(),
      clerkUserId,
      email: data.email,
      name: data.name ?? null,
      careerStage: data.careerStage ?? null,
      challenge: data.challenge ?? null,
      monthlyGoal: data.monthlyGoal ?? null,
      onboardingStep: data.onboardingStep ?? 0,
      onboardingCompleted: data.onboardingCompleted ?? false,
      joinedAt: now,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.store.profiles.set(clerkUserId, created);
    return created;
  }

  async getProfile(clerkUserId: string): Promise<Profile | null> {
    return this.store.profiles.get(clerkUserId) ?? null;
  }

  async updateOnboarding(
    clerkUserId: string,
    data: {
      name?: string;
      careerStage?: CareerStage;
      challenge?: string;
      monthlyGoal?: string;
      onboardingStep?: number;
      onboardingCompleted?: boolean;
    }
  ): Promise<Profile | null> {
    const profile = this.store.profiles.get(clerkUserId);
    if (!profile) return null;

    const updated: Profile = {
      ...profile,
      name: data.name !== undefined ? data.name : profile.name,
      careerStage: data.careerStage !== undefined ? data.careerStage : profile.careerStage,
      challenge: data.challenge !== undefined ? data.challenge : profile.challenge,
      monthlyGoal: data.monthlyGoal !== undefined ? data.monthlyGoal : profile.monthlyGoal,
      onboardingStep: data.onboardingStep !== undefined ? data.onboardingStep : profile.onboardingStep,
      onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : profile.onboardingCompleted,
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.store.profiles.set(clerkUserId, updated);
    return updated;
  }

  async updateLastActive(clerkUserId: string): Promise<void> {
    const profile = this.store.profiles.get(clerkUserId);
    if (profile) {
      profile.lastActiveAt = new Date();
    }
  }

  async listOnboardedProfiles(): Promise<Profile[]> {
    return Array.from(this.store.profiles.values()).filter((p) => p.onboardingCompleted);
  }

  async deleteProfile(clerkUserId: string): Promise<void> {
    this.store.profiles.delete(clerkUserId);
  }

  // Conversation operations
  async createConversation(clerkUserId: string, title = "New Coaching Session"): Promise<Conversation> {
    const now = new Date();
    const id = nanoid();
    const conv: Conversation = {
      id,
      clerkUserId,
      title,
      createdAt: now,
      updatedAt: now,
    };
    this.store.conversations.set(id, conv);
    return conv;
  }

  async getConversation(id: string, clerkUserId: string): Promise<Conversation | null> {
    const conv = this.store.conversations.get(id);
    if (!conv || conv.clerkUserId !== clerkUserId) return null;
    return conv;
  }

  async listConversations(clerkUserId: string, limit = 50): Promise<Conversation[]> {
    return Array.from(this.store.conversations.values())
      .filter((c) => c.clerkUserId === clerkUserId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async listConversationsWithDetails(clerkUserId: string, limit = 50) {
    const convs = await this.listConversations(clerkUserId, limit);
    return convs.map((c) => {
      const msgs = Array.from(this.store.messages.values())
        .filter((m) => m.conversationId === c.id && m.clerkUserId === clerkUserId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return {
        ...c,
        messageCount: msgs.length,
        lastMessagePreview: msgs[0] ? msgs[0].content.slice(0, 100) : null,
        lastIntent: msgs[0]?.intent || null,
      };
    });
  }

  async touchConversation(id: string, clerkUserId: string): Promise<void> {
    const conv = this.store.conversations.get(id);
    if (conv && conv.clerkUserId === clerkUserId) {
      conv.updatedAt = new Date();
    }
  }

  async updateConversationTitle(id: string, clerkUserId: string, title: string): Promise<void> {
    const conv = this.store.conversations.get(id);
    if (conv && conv.clerkUserId === clerkUserId) {
      conv.title = title;
      conv.updatedAt = new Date();
    }
  }

  async deleteConversation(id: string, clerkUserId: string): Promise<boolean> {
    const conv = this.store.conversations.get(id);
    if (!conv || conv.clerkUserId !== clerkUserId) return false;

    this.store.conversations.delete(id);
    // Cascade delete messages
    for (const [msgId, msg] of this.store.messages.entries()) {
      if (msg.conversationId === id) {
        this.store.messages.delete(msgId);
      }
    }
    return true;
  }

  async clearAllConversations(clerkUserId: string): Promise<void> {
    for (const [convId, conv] of this.store.conversations.entries()) {
      if (conv.clerkUserId === clerkUserId) {
        this.store.conversations.delete(convId);
      }
    }
    for (const [msgId, msg] of this.store.messages.entries()) {
      if (msg.clerkUserId === clerkUserId) {
        this.store.messages.delete(msgId);
      }
    }
  }

  // Message operations
  async createMessage(data: {
    conversationId: string;
    clerkUserId: string;
    role: "user" | "assistant" | "system";
    content: string;
    intent?: string | null;
  }): Promise<ConversationMessage> {
    const id = nanoid();
    const now = new Date();
    const message: ConversationMessage = {
      id,
      conversationId: data.conversationId,
      clerkUserId: data.clerkUserId,
      role: data.role,
      content: data.content,
      intent: data.intent ?? null,
      createdAt: now,
    };
    this.store.messages.set(id, message);
    return message;
  }

  async getMessages(conversationId: string, clerkUserId: string): Promise<ConversationMessage[]> {
    return Array.from(this.store.messages.values())
      .filter((m) => m.conversationId === conversationId && m.clerkUserId === clerkUserId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getRecentMessages(conversationId: string, clerkUserId: string, limit = 10): Promise<ConversationMessage[]> {
    return Array.from(this.store.messages.values())
      .filter((m) => m.conversationId === conversationId && m.clerkUserId === clerkUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Email Connection operations
  async upsertEmailConnection(
    clerkUserId: string,
    data: { email: string; appPassword?: string; encryptedAppPassword?: string; provider?: "resend" | "gmail" }
  ): Promise<EmailConnection> {
    const now = new Date();
    const encrypted = data.encryptedAppPassword || (data.appPassword ? encryptCredential(data.appPassword) : "");
    const existing = this.store.emailConnections.get(clerkUserId);

    const record: EmailConnection = {
      id: existing?.id || nanoid(),
      clerkUserId,
      email: data.email,
      provider: data.provider || "gmail",
      encryptedAppPassword: encrypted || existing?.encryptedAppPassword || "",
      iv: "",
      authTag: "",
      lastTestedAt: existing?.lastTestedAt ?? null,
      lastTestSuccess: existing?.lastTestSuccess ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.emailConnections.set(clerkUserId, record);
    return record;
  }

  async getEmailConnection(clerkUserId: string): Promise<EmailConnection | null> {
    return this.store.emailConnections.get(clerkUserId) ?? null;
  }

  async getEmailConnectionWithCredentials(
    clerkUserId: string
  ): Promise<(EmailConnection & { appPassword?: string }) | null> {
    const conn = this.store.emailConnections.get(clerkUserId);
    if (!conn) return null;

    if (!conn.encryptedAppPassword) {
      return conn;
    }

    try {
      const decrypted = decryptCredential(conn.encryptedAppPassword);
      return { ...conn, appPassword: decrypted };
    } catch {
      return conn;
    }
  }

  async deleteEmailConnection(clerkUserId: string): Promise<void> {
    this.store.emailConnections.delete(clerkUserId);
  }

  async updateLastTested(clerkUserId: string, success: boolean): Promise<void> {
    const conn = this.store.emailConnections.get(clerkUserId);
    if (conn) {
      conn.lastTestedAt = new Date();
      conn.lastTestSuccess = success;
      conn.updatedAt = new Date();
    }
  }

  // Email Preference operations
  async upsertEmailPreference(
    clerkUserId: string,
    data: { provider?: "resend" | "gmail"; weeklyCheckinsEnabled?: boolean; destinationEmail?: string | null }
  ): Promise<EmailPreference> {
    const now = new Date();
    const existing = this.store.emailPreferences.get(clerkUserId);

    const record: EmailPreference = {
      id: existing?.id || nanoid(),
      clerkUserId,
      provider: data.provider !== undefined ? data.provider : existing?.provider ?? "resend",
      weeklyCheckinsEnabled: data.weeklyCheckinsEnabled !== undefined ? data.weeklyCheckinsEnabled : existing?.weeklyCheckinsEnabled ?? true,
      destinationEmail: data.destinationEmail !== undefined ? data.destinationEmail : existing?.destinationEmail ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.emailPreferences.set(clerkUserId, record);
    return record;
  }

  async getEmailPreference(clerkUserId: string): Promise<EmailPreference | null> {
    return this.store.emailPreferences.get(clerkUserId) ?? null;
  }

  // Weekly Check-in operations
  async createCheckin(data: {
    clerkUserId: string;
    provider: "resend" | "gmail";
    recipientEmail: string;
    subject: string;
    content: string;
    status?: "pending" | "sent" | "failed";
  }): Promise<WeeklyCheckin> {
    const id = nanoid();
    const now = new Date();
    const checkin: WeeklyCheckin = {
      id,
      clerkUserId: data.clerkUserId,
      provider: data.provider,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      content: data.content,
      status: data.status || "pending",
      messageId: null,
      error: null,
      sentAt: data.status === "sent" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.weeklyCheckins.set(id, checkin);
    return checkin;
  }

  async updateCheckinStatus(
    id: string,
    status: "sent" | "failed",
    messageId?: string | null,
    error?: string | null
  ): Promise<WeeklyCheckin | null> {
    const checkin = this.store.weeklyCheckins.get(id);
    if (!checkin) return null;

    checkin.status = status;
    checkin.messageId = messageId ?? null;
    checkin.error = error ?? null;
    checkin.sentAt = status === "sent" ? new Date() : null;
    checkin.updatedAt = new Date();
    return checkin;
  }

  async hasCheckinInWindow(clerkUserId: string, sinceDate: Date): Promise<boolean> {
    return Array.from(this.store.weeklyCheckins.values()).some(
      (c) => c.clerkUserId === clerkUserId && c.createdAt >= sinceDate && (c.status === "sent" || c.status === "pending")
    );
  }

  async listCheckins(clerkUserId: string, limit = 50): Promise<WeeklyCheckin[]> {
    return Array.from(this.store.weeklyCheckins.values())
      .filter((c) => c.clerkUserId === clerkUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // AI Usage
  async recordUsage(data: {
    clerkUserId: string;
    endpointType: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }) {
    const entry = {
      id: nanoid(),
      clerkUserId: data.clerkUserId,
      endpointType: data.endpointType,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      totalTokens: data.inputTokens + data.outputTokens,
      createdAt: new Date(),
    };
    this.store.aiUsage.push(entry);
    return entry;
  }

  async getUsageSummary(clerkUserId: string) {
    const userUsage = this.store.aiUsage.filter((u) => u.clerkUserId === clerkUserId);
    const totalPromptTokens = userUsage.reduce((acc, u) => acc + u.inputTokens, 0);
    const totalCompletionTokens = userUsage.reduce((acc, u) => acc + u.outputTokens, 0);
    return {
      totalRequests: userUsage.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
    };
  }

  // Memory
  async upsertMemory(clerkUserId: string, summary: string) {
    const now = new Date();
    const existing = this.store.memory.get(clerkUserId);
    const rec = {
      id: existing?.id || nanoid(),
      clerkUserId,
      summary,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.store.memory.set(clerkUserId, rec);
    return rec;
  }

  async getMemory(clerkUserId: string) {
    return this.store.memory.get(clerkUserId) ?? null;
  }
}

export const mockStore = new MockRepositoryStore();
