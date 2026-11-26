CREATE TABLE "sps_cm_funnels_to_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"funnel_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_stages" ADD CONSTRAINT "sps_cm_funnels_to_stages_funnel_id_sps_cm_funnel_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."sps_cm_funnel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_funnels_to_stages" ADD CONSTRAINT "sps_cm_funnels_to_stages_stage_id_sps_cm_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."sps_cm_stage"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_funnels_to_stages_pair" ON "sps_cm_funnels_to_stages" USING btree ("funnel_id","stage_id");--> statement-breakpoint
CREATE INDEX "cm_funnels_to_stages_order" ON "sps_cm_funnels_to_stages" USING btree ("funnel_id","position");