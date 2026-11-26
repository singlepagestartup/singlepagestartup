ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP CONSTRAINT "sl_pe_to_ee_me_ps_4b2_store_id_sps_ee_store_id_fk";
--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP CONSTRAINT "sl_pe_to_ee_me_ps_4b2_offer_id_sps_ee_ss_to_ps_vn7_id_fk";
--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP CONSTRAINT "sl_pe_to_ee_me_ps_4b2_category_id_sps_ee_category_id_fk";
--> statement-breakpoint
DROP INDEX "sl_profile_store_expert";--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" ALTER COLUMN "ee_me_pt_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP COLUMN "store_id";--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP COLUMN "offer_id";--> statement-breakpoint
ALTER TABLE "sl_pe_to_ee_me_ps_4b2" DROP COLUMN "category_id";