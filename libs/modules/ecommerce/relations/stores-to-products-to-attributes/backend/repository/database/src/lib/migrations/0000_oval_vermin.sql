CREATE TABLE "sps_ee_ss_to_ps_to_as_v04" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ss_to_ps_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_ee_ss_to_ps_to_as_v04" ADD CONSTRAINT "sps_ee_ss_to_ps_to_as_v04_ss_to_ps_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("ss_to_ps_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_ee_ss_to_ps_to_as_v04" ADD CONSTRAINT "sps_ee_ss_to_ps_to_as_v04_ae_id_sps_ee_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sps_ee_attribute"("id") ON DELETE cascade ON UPDATE no action;