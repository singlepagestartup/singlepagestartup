CREATE TABLE "sps_bg_wallet_currency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"wallet_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text
);
--> statement-breakpoint
ALTER TABLE "sps_bg_wallet_currency" ADD CONSTRAINT "sps_bg_wallet_currency_wallet_id_sps_bg_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."sps_bg_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_bg_wallet_currency" ADD CONSTRAINT "sps_bg_wallet_currency_currency_id_sps_bg_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sps_bg_wallet_currency_lookup" ON "sps_bg_wallet_currency" USING btree ("wallet_id","currency_id");