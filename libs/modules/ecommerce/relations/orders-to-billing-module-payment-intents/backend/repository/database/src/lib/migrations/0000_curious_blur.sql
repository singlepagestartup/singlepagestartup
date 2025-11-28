CREATE TABLE "sps_ee_os_to_bg_me_pt_is_cvb" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"or_id" uuid NOT NULL,
	"bg_me_pt_it_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD CONSTRAINT "sps_ee_os_to_bg_me_pt_is_cvb_or_id_sps_ee_order_id_fk" FOREIGN KEY ("or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_os_to_bg_me_pt_is_cvb" ADD CONSTRAINT "sps_ee_os_to_bg_me_pt_is_cvb_bg_me_pt_it_id_sps_bg_pt_it_id_fk" FOREIGN KEY ("bg_me_pt_it_id") REFERENCES "public"."sps_bg_pt_it"("id") ON DELETE cascade ON UPDATE no action;