import { z } from "zod";

export const connectEmailSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("resend"),
    apiKey: z.string().min(1, "Resend API key is required"),
    fromEmail: z.string().email("Valid from email is required"),
  }),
  z.object({
    provider: z.literal("gmail_smtp"),
    email: z.string().email("Valid Gmail address is required"),
    appPassword: z
      .string()
      .min(16, "Gmail App Password must be 16 characters")
      .max(20),
  }),
]);

export const testEmailSchema = z.object({
  recipientEmail: z.string().email("Valid recipient email is required"),
  provider: z.enum(["resend", "gmail_smtp"]).optional(),
});

export type ConnectEmailInput = z.infer<typeof connectEmailSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
