CREATE TABLE "sps_w_b_fe_to_bs_as_mc2" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"variant" text DEFAULT 'default' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"class_name" text,
	"fe_id" uuid NOT NULL,
	"by_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_w_b_fe_to_bs_as_mc2" ADD CONSTRAINT "sps_w_b_fe_to_bs_as_mc2_fe_id_sps_w_b_feature_id_fk" FOREIGN KEY ("fe_id") REFERENCES "public"."sps_w_b_feature"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_w_b_fe_to_bs_as_mc2" ADD CONSTRAINT "sps_w_b_fe_to_bs_as_mc2_by_id_sps_w_b_bs_ay_8m3_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."sps_w_b_bs_ay_8m3"("id") ON DELETE cascade ON UPDATE no action;