DO $$
BEGIN
  -- 1. Создаём новую таблицу sps_rc_permission, если её ещё нет
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sps_rc_permission'
  ) THEN
    CREATE TABLE "sps_rc_permission" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      "variant" text DEFAULT 'default' NOT NULL,
      "type" text DEFAULT 'HTTP' NOT NULL,
      "method" text DEFAULT 'GET' NOT NULL,
      "path" text DEFAULT '/' NOT NULL
    );
  END IF;

  -- 2. Если старая таблица существует — переносим данные
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sps_rc_action'
  ) THEN
    INSERT INTO "sps_rc_permission" ("id", "created_at", "updated_at", "variant", "type", "method", "path")
    SELECT "id", "created_at", "updated_at", "variant", "type", "method", "path"
    FROM "sps_rc_action"
    ON CONFLICT (id) DO NOTHING;

    -- 3. Удаляем старую таблицу
    DROP TABLE IF EXISTS "sps_rc_action" CASCADE;
  END IF;
END;
$$;
