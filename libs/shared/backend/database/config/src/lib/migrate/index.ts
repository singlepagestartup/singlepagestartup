import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Config as DrizzleConfig, defineConfig } from "drizzle-kit";
import { getDrizzle, getPostgresClient } from "../postgres";
import {
  assertCaptureTable,
  readCaptureResource,
  reconcileCapture,
} from "./capture";
import { migrate as drizzleMigrator } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { readMigrationFiles } from "drizzle-orm/migrator";
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
    if (this.schema.Table) {
      assertCaptureTable(this.schemaPaths[0], this.schema.Table);
    }
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

  async migrate(options: { through?: number } = {}) {
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

      const migrationConfig = {
        migrationsFolder: this.migrationsFolder,
        migrationsTable: this.migrationsTable,
      };
      if (options.through === undefined) {
        await drizzleMigrator(db, migrationConfig);
      } else {
        const migrations = readMigrationFiles(migrationConfig);
        if (
          !Number.isSafeInteger(options.through) ||
          options.through < 0 ||
          options.through >= migrations.length
        )
          throw new Error("Invalid final migration index");
        // Run generated migrations through Drizzle's journal without rewriting files.
        // Drizzle's DDL runner types its session with an empty entity schema.
        const session = db._.session as unknown as Parameters<
          PgDialect["migrate"]
        >[1];
        await new PgDialect().migrate(
          migrations.slice(0, options.through + 1),
          session,
          migrationConfig,
        );
      }

      const afterMigrations = await db.execute(
        sql`SELECT * FROM drizzle.${sql.raw(this.migrationsTable)} ORDER BY created_at DESC, id DESC`,
      );

      const schemaChanged = beforeMigrations.length !== afterMigrations.length;
      const [capture] = await db.execute(
        sql`SELECT to_regprocedure('sps_consistency.install_capture(text,text,jsonb)') IS NOT NULL AS installed`,
      );
      if (this.schema.Table && capture?.installed) {
        const entry = await readCaptureResource(
          this.schemaPaths[0],
          this.schema.Table,
        );
        const revision = String(afterMigrations[0]?.hash ?? "");
        await reconcileCapture(getPostgresClient(), entry, revision);
      }

      if (schemaChanged) {
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
