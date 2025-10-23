CREATE TABLE "cm_is_to_os_q4g" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"it_id" uuid NOT NULL,
	"on_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cm_is_to_os_q4g" ADD CONSTRAINT "cm_is_to_os_q4g_it_id_sps_cm_input_id_fk" FOREIGN KEY ("it_id") REFERENCES "public"."sps_cm_input"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cm_is_to_os_q4g" ADD CONSTRAINT "cm_is_to_os_q4g_on_id_sps_cm_option_id_fk" FOREIGN KEY ("on_id") REFERENCES "public"."sps_cm_option"("id") ON DELETE cascade ON UPDATE no action;