CREATE TABLE "sps_bg_transaction" (
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
	"advance_amount" numeric(38, 12) DEFAULT '0' NOT NULL,
	"advance_recipient_id" uuid,
	"provider_work" jsonb,
	"settlement" jsonb,
	"event_id" uuid,
	"stage_id" text,
	"run_budget" numeric(38, 12),
	"budget" numeric(38, 12),
	CONSTRAINT "sps_bg_advance_maximum" CHECK ("sps_bg_transaction"."advance_amount" >= 0 AND "sps_bg_transaction"."advance_amount" <= "sps_bg_transaction"."amount"),
	CONSTRAINT "sps_bg_wallet_amount_positive" CHECK ("sps_bg_transaction"."amount" > 0 AND ("sps_bg_transaction"."budget" IS NULL OR "sps_bg_transaction"."budget" >= "sps_bg_transaction"."amount")),
	CONSTRAINT "sps_bg_wallet_distinct_parties" CHECK ("sps_bg_transaction"."sender_id" <> "sps_bg_transaction"."recipient_id"),
	CONSTRAINT "sps_bg_wallet_valid_kind" CHECK (("sps_bg_transaction"."kind" = 'reserve' AND "sps_bg_transaction"."state" IN ('held','released','settled') AND "sps_bg_transaction"."budget" IS NOT NULL) OR ("sps_bg_transaction"."kind" = 'transfer' AND "sps_bg_transaction"."state" = 'posted' AND "sps_bg_transaction"."budget" IS NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sps_bg_transaction_key" ON "sps_bg_transaction" USING btree ("store_id","operation_key");--> statement-breakpoint
CREATE INDEX "sps_bg_wallet_active_reserves" ON "sps_bg_transaction" USING btree ("sender_id","currency_id") WHERE "sps_bg_transaction"."state" = 'held';--> statement-breakpoint
CREATE INDEX "sps_bg_wallet_task" ON "sps_bg_transaction" USING btree ("store_id","task_id","created_at");--> statement-breakpoint
CREATE INDEX "sps_bg_wallet_settlement" ON "sps_bg_transaction" USING btree ("reservation_id");