CREATE TABLE "rc_subject_to_social_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"subject_id" uuid NOT NULL,
	"social_chat_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rc_subject_to_social_chat" ADD CONSTRAINT "rc_subject_to_social_chat_subject_id_sps_rc_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_subject_to_social_chat" ADD CONSTRAINT "rc_subject_to_social_chat_social_chat_id_sl_chat_id_fk" FOREIGN KEY ("social_chat_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rc_social_chat_owner" ON "rc_subject_to_social_chat" USING btree ("social_chat_id") WHERE "rc_subject_to_social_chat"."variant" = 'owner';--> statement-breakpoint
CREATE UNIQUE INDEX "rc_subject_social_chat_role" ON "rc_subject_to_social_chat" USING btree ("subject_id","social_chat_id","variant");