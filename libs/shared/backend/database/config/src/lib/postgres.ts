import postgres from "postgres";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

interface IApplicationLogin {
  allowed: boolean;
}

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

  if (!DATABASE_OPTIONS.user || !DATABASE_OPTIONS.password) {
    throw new Error(
      "Configuration error. Set DATABASE_USERNAME and DATABASE_PASSWORD for the application role.",
    );
  }

  // Synchronously initialize client if not already done
  // This is safe because postgres() is synchronous - connection happens lazily
  if (!isInitializing) {
    isInitializing = true;
    pgClient = postgres({
      ...DATABASE_OPTIONS,
      idle_timeout: 20,
      max_lifetime: 0,
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

/** Check the authenticated session before starting migrations or serving requests. */
export async function assertApplicationDatabaseRole() {
  const client = getPostgresClient();
  const [login] = await client<IApplicationLogin[]>`
    SELECT NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)
      AND NOT EXISTS (
        SELECT FROM pg_catalog.pg_auth_members WHERE member = r.oid OR roleid = r.oid
      ) AS allowed
    FROM pg_catalog.pg_roles r WHERE rolname = session_user
  `;

  if (!login?.allowed) {
    throw new Error(
      "Configuration error. PostgreSQL requires a dedicated application login without elevated privileges or memberships.",
    );
  }
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
