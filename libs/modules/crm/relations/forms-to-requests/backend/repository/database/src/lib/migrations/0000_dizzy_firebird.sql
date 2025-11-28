CREATE TABLE "sps_cm_fs_to_rs_b42" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"fm_id" uuid NOT NULL,
	"rt_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_fs_to_rs_b42" ADD CONSTRAINT "sps_cm_fs_to_rs_b42_fm_id_sps_cm_form_id_fk" FOREIGN KEY ("fm_id") REFERENCES "public"."sps_cm_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_fs_to_rs_b42" ADD CONSTRAINT "sps_cm_fs_to_rs_b42_rt_id_sps_cm_request_id_fk" FOREIGN KEY ("rt_id") REFERENCES "public"."sps_cm_request"("id") ON DELETE cascade ON UPDATE no action;