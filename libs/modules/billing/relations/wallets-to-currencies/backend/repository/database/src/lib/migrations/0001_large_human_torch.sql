ALTER TABLE "sps_bg_wallet_currency" DROP CONSTRAINT "sps_bg_wallet_currency_currency_id_sps_bg_currency_id_fk";
--> statement-breakpoint
ALTER TABLE "sps_bg_wallet_currency" ADD CONSTRAINT "sps_bg_wallet_currency_currency_id_sps_bg_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sps_bg_currency"("id") ON DELETE cascade ON UPDATE no action;