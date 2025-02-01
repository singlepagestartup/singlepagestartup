CREATE TABLE "sps_cm_ws_to_fs_vf2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"class_name" text,
	"wt_id" uuid NOT NULL,
	"fm_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_ws_to_fs_vf2" ADD CONSTRAINT "sps_cm_ws_to_fs_vf2_wt_id_sps_cm_widget_id_fk" FOREIGN KEY ("wt_id") REFERENCES "public"."sps_cm_widget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_ws_to_fs_vf2" ADD CONSTRAINT "sps_cm_ws_to_fs_vf2_fm_id_sps_cm_form_id_fk" FOREIGN KEY ("fm_id") REFERENCES "public"."sps_cm_form"("id") ON DELETE cascade ON UPDATE no action;