-- Fill admin_title from string.en field or id if string.en is empty
UPDATE "sps_ee_attribute"
SET "admin_title" = COALESCE(
  NULLIF(TRIM("string"->>'en'), ''),
  "id"::text
)
WHERE "admin_title" IS NULL OR TRIM("admin_title") = '';--> statement-breakpoint

-- Fill slug from id
UPDATE "sps_ee_attribute"
SET "slug" = "id"::text
WHERE "slug" IS NULL OR TRIM("slug") = '';--> statement-breakpoint

ALTER TABLE "sps_ee_attribute" ALTER COLUMN "admin_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_attribute" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sps_ee_attribute" ADD CONSTRAINT "sps_ee_attribute_slug_unique" UNIQUE("slug");