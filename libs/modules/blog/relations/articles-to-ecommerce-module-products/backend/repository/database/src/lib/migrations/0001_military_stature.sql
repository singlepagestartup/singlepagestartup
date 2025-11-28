ALTER TABLE "bg_as_to_ee_me_ps_bd9" RENAME COLUMN "pt_id" TO "ee_me_pt_id";--> statement-breakpoint
ALTER TABLE "bg_as_to_ee_me_ps_bd9" DROP CONSTRAINT "bg_as_to_ee_me_ps_bd9_pt_id_sps_ee_product_id_fk";
--> statement-breakpoint
ALTER TABLE "bg_as_to_ee_me_ps_bd9" ADD CONSTRAINT "bg_as_to_ee_me_ps_bd9_ee_me_pt_id_sps_ee_product_id_fk" FOREIGN KEY ("ee_me_pt_id") REFERENCES "public"."sps_ee_product"("id") ON DELETE cascade ON UPDATE no action;