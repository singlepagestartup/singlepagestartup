import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { resolve } from "node:path";

interface ICaptureResource {
  resource: string;
  topic: string;
  columns: Record<string, string>;
}

try {
  const discovery = Bun.spawnSync(
    [
      process.execPath,
      resolve(
        "tools/plugins/sps-generator-plugin/src/utils/consistency-migrations/generate.ts",
      ),
      "--catalog",
    ],
    { cwd: process.cwd(), stdout: "pipe", stderr: "inherit" },
  );
  if (discovery.exitCode !== 0)
    throw new Error("Could not discover the effective consistency catalog");
  const catalog: { resources: ICaptureResource[] } = JSON.parse(
    new TextDecoder().decode(discovery.stdout),
  );
  if (!Array.isArray(catalog.resources) || !catalog.resources.length)
    throw new Error(
      "No effective consistency schemas found; run migrations from the repository root",
    );
  await migrate(getDrizzle({}), {
    migrationsFolder: resolve(import.meta.dir, "migrations"),
    migrationsTable: "sps_consistency",
    migrationsSchema: "drizzle",
  });
  const pg = getPostgresClient();
  await pg.begin(async (transaction) => {
    const previous =
      await transaction`SELECT resource,topic,columns FROM sps_consistency.resource ORDER BY resource`;
    const signature = (resources: ICaptureResource[]) =>
      JSON.stringify(
        [...resources]
          .sort((a, b) => a.resource.localeCompare(b.resource))
          .map((resource) => [
            resource.resource,
            resource.topic,
            Object.entries(resource.columns).sort(([a], [b]) =>
              a.localeCompare(b),
            ),
          ]),
      );
    const changed =
      signature(previous as unknown as ICaptureResource[]) !==
      signature(catalog.resources);
    const names = catalog.resources.map((resource) => resource.resource);
    await transaction`DELETE FROM sps_consistency.resource WHERE NOT (resource = ANY(${transaction.array(names)}::text[]))`;
    for (const resource of catalog.resources)
      await transaction`SELECT sps_consistency.install_capture(${resource.resource},${resource.topic},${JSON.stringify(resource.columns)}::jsonb)`;
    if (changed) {
      await transaction`SELECT sps_consistency.bump(ARRAY(SELECT resource||'|reset' FROM sps_consistency.resource ORDER BY resource))`;
      await transaction`UPDATE sps_consistency.state SET value=gen_random_uuid()::text WHERE id='epoch'`;
    }
  });
  console.log("Consistency migrations applied");
} finally {
  await getPostgresClient().end();
}
