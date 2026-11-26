CREATE TABLE "sps_rc_subject_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"subject_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	CONSTRAINT "sps_rc_subject_wallet_wallet_id_unique" UNIQUE("wallet_id")
);
--> statement-breakpoint
ALTER TABLE "sps_rc_subject_wallet" ADD CONSTRAINT "sps_rc_subject_wallet_subject_id_sps_rc_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_subject_wallet" ADD CONSTRAINT "sps_rc_subject_wallet_wallet_id_sps_bg_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."sps_bg_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_default_wallet_owner" ON "sps_rc_subject_wallet" USING btree ("subject_id") WHERE "sps_rc_subject_wallet"."variant" = 'default';