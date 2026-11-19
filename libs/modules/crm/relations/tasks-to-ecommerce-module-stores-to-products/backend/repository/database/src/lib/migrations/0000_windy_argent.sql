CREATE TABLE "sps_cm_tasks_to_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_offers" ADD CONSTRAINT "sps_cm_tasks_to_offers_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_offers" ADD CONSTRAINT "sps_cm_tasks_to_offers_offer_id_sps_ee_ss_to_ps_vn7_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sps_ee_ss_to_ps_vn7"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_offers_owner" ON "sps_cm_tasks_to_offers" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cm_tasks_to_offers_target" ON "sps_cm_tasks_to_offers" USING btree ("offer_id");