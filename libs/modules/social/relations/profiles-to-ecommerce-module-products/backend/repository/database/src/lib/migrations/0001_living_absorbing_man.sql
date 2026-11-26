ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ALTER COLUMN "ee_me_pt_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD CONSTRAINT "sl_pe_to_ee_me_ps_4b2_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD CONSTRAINT "sl_pe_to_ee_me_ps_4b2_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ADD CONSTRAINT "sl_pe_to_ee_me_ps_4b2_category_id_sps_ee_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."sps_ee_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sl_profile_store_expert" ON "sl_pe_to_ee_me_ps_4b2" USING btree ("store_id","offer_id","ee_me_pt_id","category_id");