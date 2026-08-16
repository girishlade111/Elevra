import { z } from "zod";

export const connectGmailSchema = z.object({
  provider: z.literal("gmail"),
  email: z
    .string()
    .email("Please enter a valid Gmail address.")
    .refine((val) => val.toLowerCase().endsWith("@gmail.com") || val.toLowerCase().includes("@googlemail.com"), {
      message: "Address must be a valid @gmail.com or Google Workspace email.",
    }),
  appPassword: z
    .string()
    .min(16, "Google App Password must be at least 16 characters (e.g. abcd efgh ijkl mnop).")
    .max(25, "Google App Password cannot exceed 25 characters.")
    .refine((val) => val.replace(/\s+/g, "").length === 16, {
      message: "Google App Password must contain exactly 16 characters (spaces are automatically ignored).",
    }),
});

export const connectResendSchema = z.object({
  provider: z.literal("resend"),
});

export const connectEmailSchema = z.discriminatedUnion("provider", [
  connectGmailSchema,
  connectResendSchema,
]);

export const testEmailSchema = z.object({
  recipientEmail: z.string().email("Please provide a valid recipient email address."),
  provider: z.enum(["resend", "gmail"]).optional(),
});

export const updateEmailPreferencesSchema = z.object({
  provider: z.enum(["resend", "gmail"]).optional(),
  weeklyCheckinsEnabled: z.boolean().optional(),
  destinationEmail: z.string().email("Please provide a valid destination email address.").optional(),
});

export type ConnectGmailInput = z.infer<typeof connectGmailSchema>;
export type ConnectEmailInput = z.infer<typeof connectEmailSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
export type UpdateEmailPreferencesInput = z.infer<typeof updateEmailPreferencesSchema>;
