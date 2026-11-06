ALTER TABLE "sps_consistency"."query" ADD COLUMN "fingerprint" text;--> statement-breakpoint
CREATE INDEX "consistency_query_retention" ON "sps_consistency"."query" USING btree ("retain_until");--> statement-breakpoint
CREATE INDEX "consistency_query_dependencies" ON "sps_consistency"."query" USING gin ("dependencies");--> statement-breakpoint
ALTER TABLE "sps_consistency"."query" ADD CONSTRAINT "query_fingerprint_unique" UNIQUE("fingerprint");