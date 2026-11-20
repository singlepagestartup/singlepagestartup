CREATE TABLE "sps_cm_tasks_to_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"task_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_publications" ADD CONSTRAINT "sps_cm_tasks_to_publications_task_id_sps_cm_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sps_cm_task"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sps_cm_tasks_to_publications" ADD CONSTRAINT "sps_cm_tasks_to_publications_publication_id_sps_cm_funnel_publication_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."sps_cm_funnel_publication"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cm_tasks_to_publications_owner" ON "sps_cm_tasks_to_publications" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "cm_tasks_to_publications_target" ON "sps_cm_tasks_to_publications" USING btree ("publication_id");