import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  clientMessageId: z.string().max(120).optional(),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  includeIntentAnalysis: z.boolean().default(true),
});

export const createConversationSchema = z.object({
  initialMessage: z.string().max(4000).optional(),
  title: z.string().max(120).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(120, "Title cannot exceed 120 characters"),
});

export const conversationIdParamSchema = z.object({
  id: z.string().min(1, "Conversation ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
