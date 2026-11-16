CREATE TABLE "sl_ps_to_ee_me_os_1ne" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ee_me_or_id" uuid NOT NULL,
	CONSTRAINT "sl_ps_to_ee_me_os_1ne_ee_me_or_id_unique" UNIQUE("ee_me_or_id")
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_ee_me_os_1ne" ADD CONSTRAINT "sl_ps_to_ee_me_os_1ne_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_ee_me_os_1ne" ADD CONSTRAINT "sl_ps_to_ee_me_os_1ne_ee_me_or_id_sps_ee_order_id_fk" FOREIGN KEY ("ee_me_or_id") REFERENCES "public"."sps_ee_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_profile_orders_profile_idx" ON "sl_ps_to_ee_me_os_1ne" USING btree ("pe_id");