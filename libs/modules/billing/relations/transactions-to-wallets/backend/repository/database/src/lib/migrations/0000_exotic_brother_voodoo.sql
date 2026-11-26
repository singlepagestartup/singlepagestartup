CREATE TABLE "sps_bg_transaction_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"sender_wallet_id" uuid NOT NULL,
	"recipient_wallet_id" uuid NOT NULL,
	"advance_recipient_wallet_id" uuid,
	"currency_id" uuid NOT NULL,
	CONSTRAINT "sps_bg_transaction_wallet_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "sps_bg_transaction_wallet" ADD CONSTRAINT "sps_bg_transaction_wallet_transaction_id_sps_bg_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."sps_bg_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_transaction_wallet" ADD CONSTRAINT "sps_bg_transaction_wallet_sender_wallet_id_sps_bg_wallet_id_fk" FOREIGN KEY ("sender_wallet_id") REFERENCES "public"."sps_bg_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_transaction_wallet" ADD CONSTRAINT "sps_bg_transaction_wallet_recipient_wallet_id_sps_bg_wallet_id_fk" FOREIGN KEY ("recipient_wallet_id") REFERENCES "public"."sps_bg_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_transaction_wallet" ADD CONSTRAINT "sps_bg_transaction_wallet_advance_recipient_wallet_id_sps_bg_wallet_id_fk" FOREIGN KEY ("advance_recipient_wallet_id") REFERENCES "public"."sps_bg_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_transaction_wallet" ADD CONSTRAINT "sps_bg_transaction_wallet_currency_id_sps_bg_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sps_bg_transaction_sending_wallet" ON "sps_bg_transaction_wallet" USING btree ("sender_wallet_id","currency_id");