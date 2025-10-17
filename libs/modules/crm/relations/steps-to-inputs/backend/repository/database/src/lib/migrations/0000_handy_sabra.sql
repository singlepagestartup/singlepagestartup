CREATE TABLE "cm_ss_to_is_5ac" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"sp_id" uuid NOT NULL,
	"it_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cm_ss_to_is_5ac" ADD CONSTRAINT "cm_ss_to_is_5ac_sp_id_cm_step_id_fk" FOREIGN KEY ("sp_id") REFERENCES "public"."cm_step"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cm_ss_to_is_5ac" ADD CONSTRAINT "cm_ss_to_is_5ac_it_id_sps_cm_input_id_fk" FOREIGN KEY ("it_id") REFERENCES "public"."sps_cm_input"("id") ON DELETE cascade ON UPDATE no action;