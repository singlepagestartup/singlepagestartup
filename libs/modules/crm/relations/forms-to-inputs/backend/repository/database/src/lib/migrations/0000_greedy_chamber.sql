CREATE TABLE "sps_cm_fs_to_is_b7h" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"it_id" uuid NOT NULL,
	"fm_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_fs_to_is_b7h" ADD CONSTRAINT "sps_cm_fs_to_is_b7h_it_id_sps_cm_input_id_fk" FOREIGN KEY ("it_id") REFERENCES "public"."sps_cm_input"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_fs_to_is_b7h" ADD CONSTRAINT "sps_cm_fs_to_is_b7h_fm_id_sps_cm_form_id_fk" FOREIGN KEY ("fm_id") REFERENCES "public"."sps_cm_form"("id") ON DELETE cascade ON UPDATE no action;