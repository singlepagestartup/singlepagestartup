CREATE TABLE "sl_ae_ks_to_as_b02" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"ae_ky_id" uuid NOT NULL,
	"ae_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sl_ae_ks_to_as_b02" ADD CONSTRAINT "sl_ae_ks_to_as_b02_ae_ky_id_sl_ae_ky_id_fk" FOREIGN KEY ("ae_ky_id") REFERENCES "public"."sl_ae_ky"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sl_ae_ks_to_as_b02" ADD CONSTRAINT "sl_ae_ks_to_as_b02_ae_id_sl_attribute_id_fk" FOREIGN KEY ("ae_id") REFERENCES "public"."sl_attribute"("id") ON DELETE cascade ON UPDATE no action;