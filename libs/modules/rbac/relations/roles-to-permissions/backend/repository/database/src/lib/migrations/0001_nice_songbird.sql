DO $$
BEGIN
  -- 1. Создаём новую таблицу sps_rc_rs_to_ps_mz2, если её ещё нет
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sps_rc_rs_to_ps_mz2'
  ) THEN
    CREATE TABLE "sps_rc_rs_to_ps_mz2" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      "variant" text DEFAULT 'default' NOT NULL,
      "order_index" integer DEFAULT 0 NOT NULL,
      "class_name" text,
      "re_id" uuid NOT NULL,
      "pn_id" uuid NOT NULL,
      "condition" text
    );

    ALTER TABLE "sps_rc_rs_to_ps_mz2"
      ADD CONSTRAINT "sps_rc_rs_to_ps_mz2_re_id_sps_rc_role_id_fk"
      FOREIGN KEY ("re_id") REFERENCES "public"."sps_rc_role"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "sps_rc_rs_to_ps_mz2"
      ADD CONSTRAINT "sps_rc_rs_to_ps_mz2_pn_id_sps_rc_permission_id_fk"
      FOREIGN KEY ("pn_id") REFERENCES "public"."sps_rc_permission"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  -- 2. Если старая таблица существует — переносим данные
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sps_rc_rs_to_as_mz2'
  ) THEN
    INSERT INTO "sps_rc_rs_to_ps_mz2" (
      "id",
      "created_at",
      "updated_at",
      "variant",
      "order_index",
      "class_name",
      "re_id",
      "pn_id",
      "condition"
    )
    SELECT
      "id",
      "created_at",
      "updated_at",
      "variant",
      "order_index",
      "class_name",
      "re_id",
      "an_id"   -- тут просто переезд FK: action → permission с тем же id
      ,
      "condition"
    FROM "sps_rc_rs_to_as_mz2"
    ON CONFLICT ("id") DO NOTHING;

    -- 3. Удаляем старую таблицу
    DROP TABLE "sps_rc_rs_to_as_mz2";
  END IF;
END;
$$;
