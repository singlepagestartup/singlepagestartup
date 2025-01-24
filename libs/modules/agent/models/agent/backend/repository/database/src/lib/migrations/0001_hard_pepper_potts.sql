UPDATE "sps_agent_agent"
SET "slug" = CONCAT('default-slug-', id)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "sps_agent_agent" ADD COLUMN "admin_title" text DEFAULT 'Default Admin Title';

ALTER TABLE "sps_agent_agent" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "sps_agent_agent" ALTER COLUMN "admin_title" SET NOT NULL;