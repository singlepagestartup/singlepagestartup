import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

let pgClient: ReturnType<typeof postgres> | null = null;
const drizzleInstances = new Map<string, PostgresJsDatabase<any>>();
let isShutdownHookSet = false;
let isInitializing = false;
let initPromise: Promise<ReturnType<typeof postgres>> | null = null;

// Increase max listeners globally to prevent warnings during migrations
process.setMaxListeners(100);

// Detect if running in migration context via env variable or argv
const isMigration =
  process.env.DB_MIGRATION === "true" ||
  process.argv.some((arg) => arg.includes("migrate.ts"));

export function getPostgresClient() {
  if (pgClient) {
    return pgClient;
  }

  // Synchronously initialize client if not already done
  // This is safe because postgres() is synchronous - connection happens lazily
  if (!isInitializing) {
    isInitializing = true;
    pgClient = postgres({
      ...DATABASE_OPTIONS,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      // Use reasonable pool size - all models share this pool
      max: isMigration ? 1 : 20,
      connect_timeout: 10,
      onnotice: () => {}, // Suppress NOTICE messages
    });

    if (!isShutdownHookSet) {
      isShutdownHookSet = true;

      const shutdown = async () => {
        if (pgClient) {
          await pgClient.end();

          logger.debug("Postgres connection closed.");

          pgClient = null;
          isInitializing = false;
          initPromise = null;
        }
        process.exit(0);
      };

      process.removeAllListeners("SIGTERM");
      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);
    }

    isInitializing = false;
  }

  return pgClient!;
}

export function getDrizzle(schema: any) {
  // Always use "default" key - all models share the same drizzle instance
  // This prevents creating 200 separate instances
  const schemaKey = "default";

  if (!drizzleInstances.has(schemaKey)) {
    // Initialize client synchronously (postgres() doesn't connect until first query)
    const client = getPostgresClient();
    const db = drizzle(client, {
      schema,
      logger: false, // Disable logging for performance
    });
    drizzleInstances.set(schemaKey, db);
  }

  return drizzleInstances.get(schemaKey)!;
}

export function resetPostgresClient() {
  pgClient = null;
  drizzleInstances.clear();
  isShutdownHookSet = false;
  isInitializing = false;
  initPromise = null;
}
