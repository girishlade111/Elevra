CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"career_stage" text,
	"challenge" text,
	"monthly_goal" text,
	"onboarding_step" integer DEFAULT 0 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"endpoint_type" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_memory_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"intent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text DEFAULT 'New Conversation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"provider" text DEFAULT 'resend' NOT NULL,
	"weekly_checkins_enabled" boolean DEFAULT true NOT NULL,
	"destination_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"encrypted_app_password" text NOT NULL,
	"provider" text DEFAULT 'gmail' NOT NULL,
	"is_connected" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"provider" text NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_clerk_user_id_unique" ON "profiles" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "profiles_clerk_user_id_idx" ON "profiles" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_clerk_user_id_idx" ON "ai_usage" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conv_memory_clerk_user_id_idx" ON "conversation_memory" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "conv_messages_conversation_id_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conv_messages_clerk_user_id_idx" ON "conversation_messages" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "conv_messages_created_at_idx" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_clerk_user_id_idx" ON "conversations" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "conversations_created_at_idx" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_preferences_clerk_user_id_unique" ON "email_preferences" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "email_preferences_clerk_user_id_idx" ON "email_preferences" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gmail_connections_clerk_user_id_unique" ON "gmail_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "gmail_connections_clerk_user_id_idx" ON "gmail_connections" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "weekly_checkins_clerk_user_id_idx" ON "weekly_checkins" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "weekly_checkins_created_at_idx" ON "weekly_checkins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "weekly_checkins_status_idx" ON "weekly_checkins" USING btree ("status");