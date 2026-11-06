import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

try {
  await migrate(getDrizzle({}), {
    migrationsFolder: resolve(import.meta.dir, "migrations"),
    migrationsTable: "sps_consistency",
    migrationsSchema: "drizzle",
  });
  const pg = getPostgresClient();
  const catalog = JSON.parse(
    await readFile(resolve(import.meta.dir, "migrations/capture.json"), "utf8"),
  );
  for (const resource of catalog.resources)
    await pg`SELECT sps_consistency.install_capture(${resource.resource},${resource.topic},${JSON.stringify(resource.columns)}::jsonb)`;
  console.log("Consistency migrations applied");
} finally {
  await getPostgresClient().end();
}
