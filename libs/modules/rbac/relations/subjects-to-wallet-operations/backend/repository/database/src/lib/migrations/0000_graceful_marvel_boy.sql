CREATE TABLE "sps_rc_wallet_operation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"operation_key" text NOT NULL,
	"reservation_id" uuid,
	"purpose" text NOT NULL,
	"kind" text NOT NULL,
	"state" text NOT NULL,
	"amount" numeric(38, 12) NOT NULL,
	"budget" numeric(38, 12),
	CONSTRAINT "sps_rc_wallet_amount_positive" CHECK ("sps_rc_wallet_operation"."amount" > 0 AND ("sps_rc_wallet_operation"."budget" IS NULL OR "sps_rc_wallet_operation"."budget" >= "sps_rc_wallet_operation"."amount")),
	CONSTRAINT "sps_rc_wallet_distinct_parties" CHECK ("sps_rc_wallet_operation"."sender_id" <> "sps_rc_wallet_operation"."recipient_id"),
	CONSTRAINT "sps_rc_wallet_valid_kind" CHECK (("sps_rc_wallet_operation"."kind" = 'reserve' AND "sps_rc_wallet_operation"."state" IN ('held','released','settled') AND "sps_rc_wallet_operation"."budget" IS NOT NULL) OR ("sps_rc_wallet_operation"."kind" = 'transfer' AND "sps_rc_wallet_operation"."state" = 'posted' AND "sps_rc_wallet_operation"."budget" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD CONSTRAINT "sps_rc_wallet_operation_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD CONSTRAINT "sps_rc_wallet_operation_actor_id_sps_rc_subject_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD CONSTRAINT "sps_rc_wallet_operation_sender_id_sps_rc_subject_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD CONSTRAINT "sps_rc_wallet_operation_recipient_id_sps_rc_subject_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."sps_rc_subject"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_rc_wallet_operation" ADD CONSTRAINT "sps_rc_wallet_operation_currency_id_sps_bg_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_rc_wallet_operation_key" ON "sps_rc_wallet_operation" USING btree ("store_id","operation_key");--> statement-breakpoint
CREATE INDEX "sps_rc_wallet_active_reserves" ON "sps_rc_wallet_operation" USING btree ("sender_id","currency_id") WHERE "sps_rc_wallet_operation"."state" = 'held';--> statement-breakpoint
CREATE INDEX "sps_rc_wallet_task" ON "sps_rc_wallet_operation" USING btree ("store_id","task_id","created_at");--> statement-breakpoint
CREATE INDEX "sps_rc_wallet_settlement" ON "sps_rc_wallet_operation" USING btree ("reservation_id");