import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  includeIntentAnalysis: z.boolean().default(true),
});

export const createConversationSchema = z.object({
  initialMessage: z.string().max(4000).optional(),
  title: z.string().max(120).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
