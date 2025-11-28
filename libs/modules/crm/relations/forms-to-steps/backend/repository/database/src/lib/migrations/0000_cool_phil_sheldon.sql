CREATE TABLE "cm_fs_to_ss_kqx" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"fm_id" uuid NOT NULL,
	"sp_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cm_fs_to_ss_kqx" ADD CONSTRAINT "cm_fs_to_ss_kqx_fm_id_sps_cm_form_id_fk" FOREIGN KEY ("fm_id") REFERENCES "public"."sps_cm_form"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cm_fs_to_ss_kqx" ADD CONSTRAINT "cm_fs_to_ss_kqx_sp_id_cm_step_id_fk" FOREIGN KEY ("sp_id") REFERENCES "public"."cm_step"("id") ON DELETE cascade ON UPDATE no action;