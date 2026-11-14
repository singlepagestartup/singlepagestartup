import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  getDrizzle,
  getPostgresClient,
  readCaptureCatalog,
} from "@sps/shared-backend-database-config";
import { ConsistencyStore } from "../consistency";
import { resolve } from "node:path";

try {
  const pg = getPostgresClient();
  if (process.argv.includes("--finalize")) {
    const catalog = await readCaptureCatalog();
    const store = new ConsistencyStore();
    await store.assertCoverage(catalog);
    // Retire old names only after every model has finished migrating.
    const declared = catalog.map((entry) => entry.resource);
    await pg.begin(async (tx) => {
      const retired = await tx`
        DELETE FROM sps_consistency.resource
        WHERE to_regclass(resource) IS NULL AND resource NOT IN (
          SELECT jsonb_array_elements_text(${JSON.stringify(declared)}::text::jsonb)
        ) RETURNING resource
      `;
      for (const { resource } of retired) {
        await tx`DELETE FROM sps_consistency.state WHERE id = ${"migration:" + resource}`;
        await tx`SELECT sps_consistency.bump(ARRAY[${resource + "|reset"}]::text[])`;
      }
    });
    console.log(`Consistency capture verified for ${catalog.length} tables`);
  } else {
    await migrate(getDrizzle({}), {
      migrationsFolder: resolve(import.meta.dir, "migrations"),
      migrationsTable: "sps_consistency",
      migrationsSchema: "drizzle",
    });
    console.log("Consistency migrations applied");
  }
} finally {
  await getPostgresClient().end();
}
