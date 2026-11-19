ALTER TABLE "sl_message" ADD COLUMN "work_reply_key" text;--> statement-breakpoint
ALTER TABLE "sl_message" ADD CONSTRAINT "sl_message_work_reply_key_unique" UNIQUE("work_reply_key");