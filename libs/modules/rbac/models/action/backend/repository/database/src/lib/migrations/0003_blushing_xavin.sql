DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rc_action' AND column_name = 'payload'
    ) THEN
        ALTER TABLE "rc_action" ADD COLUMN "payload" jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
--> statement-breakpoint