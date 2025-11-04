ALTER TABLE "ee_cs_to_we_br_me_ws_bfm" RENAME COLUMN "wt_id" TO "we_br_me_wt_id";--> statement-breakpoint
ALTER TABLE "ee_cs_to_we_br_me_ws_bfm" DROP CONSTRAINT "ee_cs_to_we_br_me_ws_bfm_wt_id_sps_w_b_widgets_id_fk";
--> statement-breakpoint
ALTER TABLE "ee_cs_to_we_br_me_ws_bfm" ADD CONSTRAINT "ee_cs_to_we_br_me_ws_bfm_we_br_me_wt_id_sps_w_b_widgets_id_fk" FOREIGN KEY ("we_br_me_wt_id") REFERENCES "public"."sps_w_b_widgets"("id") ON DELETE cascade ON UPDATE no action;