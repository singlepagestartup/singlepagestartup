ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ss_gch_store_id_sps_ee_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sps_ee_store"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ke_me_ss_gch" ADD CONSTRAINT "sl_ps_to_ke_me_ss_gch_project_id_sl_thread_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."sl_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sl_profile_source_scope" ON "sl_ps_to_ke_me_ss_gch" USING btree ("pe_id","store_id","project_id");