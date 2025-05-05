ALTER TABLE "sps_ee_product" ADD COLUMN "admin_title" text;

UPDATE "sps_ee_product" SET "admin_title" = CONCAT('product-', id::text);

ALTER TABLE "sps_ee_product" ALTER COLUMN "admin_title" SET NOT NULL;
