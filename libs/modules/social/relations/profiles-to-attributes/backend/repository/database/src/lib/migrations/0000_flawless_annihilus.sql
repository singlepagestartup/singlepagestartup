CREATE TABLE "sl_ps_to_as_v06" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"pe_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ps_to_as_v06" ADD CONSTRAINT "sl_ps_to_as_v06_pe_id_sl_profile_id_fk" FOREIGN KEY ("pe_id") REFERENCES "public"."sl_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ps_to_as_v06" ADD CONSTRAINT "sl_ps_to_as_v06_ae_id_sl_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sl_attribute"("id") ON DELETE cascade ON UPDATE no action;