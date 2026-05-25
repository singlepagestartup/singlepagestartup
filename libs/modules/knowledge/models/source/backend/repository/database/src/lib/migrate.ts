import { migrate } from "./config";
import { getDrizzle } from "@sps/shared-backend-database-config";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

async function normalizeMigrationHistoryTable() {
  const db = getDrizzle({ schema });

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await db.execute(sql`
    DO $$
    BEGIN
      IF to_regclass('drizzle.sps_kn_source') IS NOT NULL
        AND to_regclass('drizzle.sps_ke_source') IS NULL THEN
        ALTER TABLE drizzle.sps_kn_source RENAME TO sps_ke_source;
      END IF;
    END $$;
  `);
}

normalizeMigrationHistoryTable()
  .then(() => migrate.migrate())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
