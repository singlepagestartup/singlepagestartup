import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DATABASE_OPTIONS } from "@sps/shared-utils";

let pgClient: ReturnType<typeof postgres> | null = null;
const drizzleInstances = new Map<string, PostgresJsDatabase<any>>();

export function getPostgresClient() {
  if (!pgClient) {
    pgClient = postgres({
      ...DATABASE_OPTIONS,
      idle_timeout: 60,
      max_lifetime: 1800,
    });
  }
  return pgClient;
}

export function getDrizzle(schema: any) {
  const schemaKey = schema?.title?.uniqueName || "default";

  if (schemaKey.includes("_title_unique")) {
    const defaultConnection = drizzleInstances.get("default")!;

    if (defaultConnection) {
      return defaultConnection;
    }
  }

  if (!drizzleInstances.has(schemaKey)) {
    const db = drizzle(getPostgresClient(), { schema });
    drizzleInstances.set(schemaKey, db);
  }

  return drizzleInstances.get(schemaKey)!;
}

process.once("SIGTERM", async () => {
  if (pgClient) {
    await pgClient.end();
    pgClient = null;
    process.exit(0);
  }
});
