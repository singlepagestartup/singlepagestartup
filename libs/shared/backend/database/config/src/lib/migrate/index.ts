import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Config as DrizzleConfig, defineConfig } from "drizzle-kit";
import { getDrizzle } from "../postgres";
import { migrate as drizzleMigrator } from "drizzle-orm/postgres-js/migrator";
import { sql, getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { logger } from "@sps/backend-utils";

export class Config {
  out: string;
  schemaPaths: string[];
  drizzleConfig: DrizzleConfig;
  migrationsTable: string;
  migrationsFolder: string;
  schema: any;

  constructor(props: {
    schemaPaths: string[];
    migrationsTable: string;
    migrationsFolder: string;
    schema: any;
  }) {
    this.out = "./src/lib/migrations";
    this.schemaPaths = props.schemaPaths;
    this.migrationsTable = props.migrationsTable;
    this.migrationsFolder = props.migrationsFolder;
    this.schema = props.schema;
  }

  init() {
    this.drizzleConfig = defineConfig({
      schema: this.schemaPaths,
      out: this.out,
      dialect: "postgresql",
      dbCredentials: DATABASE_OPTIONS,
      verbose: true,
      strict: true,
    }) satisfies DrizzleConfig;
  }

  config() {
    this.init();

    return this.drizzleConfig;
  }

  async migrate() {
    try {
      if (Object.keys(DATABASE_OPTIONS).length < 2) {
        throw new Error(
          "Configuration error. Database credentials are missing",
        );
      }

      let beforeMigrations = [];

      const db = getDrizzle({ schema: this.schema });

      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

      try {
        beforeMigrations = await db.execute(
          sql`SELECT * FROM drizzle.${sql.raw(this.migrationsTable)}`,
        );
      } catch (error: any) {
        if (!error.message.includes("does not exist")) {
          throw error;
        }
      }

      await drizzleMigrator(db, {
        migrationsFolder: this.migrationsFolder,
        migrationsTable: this.migrationsTable,
      });

      // The infrastructure migration runs first. Reinstall after table changes,
      // including new/startup Tables; no cache-specific relation map is needed.
      const [installed] = await db.execute(
        sql`SELECT to_regprocedure('sps_consistency.install_capture(text,text,jsonb)') IS NOT NULL AS ready`,
      );
      if (installed?.ready && this.schema.Table) {
        const table = this.schema.Table;
        const config = getTableConfig(table);
        const resource = `${config.schema || "public"}.${config.name}`;
        const columns = Object.fromEntries(
          Object.entries(
            getTableColumns(table) as Record<string, { name: string }>,
          ).map(([key, column]) => [key, column.name]),
        );
        await db.execute(
          sql`SELECT sps_consistency.install_capture(${resource},coalesce((SELECT topic FROM sps_consistency.resource WHERE resource=${resource}),${resource}),${JSON.stringify(columns)}::jsonb)`,
        );
      }

      const afterMigrations = await db.execute(
        sql`SELECT * FROM drizzle.${sql.raw(this.migrationsTable)}`,
      );

      if (beforeMigrations.length !== afterMigrations.length) {
        logger.info("NEW_MIGRATIONS=true");
      }

      // Explicitly close the connection and reset client
      const postgres = await import("../postgres");
      const client = postgres.getPostgresClient();
      await client.end();
      postgres.resetPostgresClient();

      process.exit(0);
    } catch (error) {
      logger.error(error);

      // Close connection on error too
      try {
        const postgres = await import("../postgres");
        const client = postgres.getPostgresClient();
        await client.end();
        postgres.resetPostgresClient();
      } catch {}

      process.exit(1);
    }
  }
}
