ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "order_line_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "offer_id" uuid;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "reservation_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "reservation_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD COLUMN "purchase_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD CONSTRAINT "sps_ee_os_to_bg_me_pt_is_cvb_order_line_id_sps_ee_os_to_ps_d4c_id_fk" FOREIGN KEY ("order_line_id") REFERENCES "public"."sps_ee_os_to_ps_d4c"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD CONSTRAINT "sps_ee_os_to_bg_me_pt_is_cvb_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sps_ee_payment_attempt_order_line_unique" ON "sps_ee_os_to_bg_me_pt_is_cvb" USING btree ("bg_me_pt_it_id","order_line_id");--> statement-breakpoint
CREATE INDEX "sps_ee_offer_reservation_status" ON "sps_ee_os_to_bg_me_pt_is_cvb" USING btree ("offer_id","reservation_status");